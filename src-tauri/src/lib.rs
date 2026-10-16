// The desktop shell: a tray icon that stays resident and a main window that
// exists only while it is used. Closing the window hides it to the tray; after
// RELEASE_AFTER hidden, the window and its web view are destroyed, so the idle
// app costs a few megabytes instead of a running browser engine. Opening it
// again rebuilds the window. Answers and scores are saved as they happen, so
// destroying the web view loses nothing but an unfinished quiz.
//
// The window is frameless; the app draws its own caption buttons (see
// docs/design/DESKTOP.md).

use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::image::Image;
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, RunEvent, Runtime, WebviewWindow, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_window_state::{AppHandleExt, StateFlags, WindowExt};

const MAIN: &str = "main";
const TRAY: &str = "tray";
/// How long a hidden window keeps its web view before it is destroyed.
const RELEASE_AFTER: Duration = Duration::from_secs(5 * 60);
/// How long the one-time "keeps running in the tray" note shows before hiding.
const HINT_FOR: Duration = Duration::from_millis(2200);
/// How often the tray checks whether the taskbar switched between dark and light.
const THEME_CHECK: Duration = Duration::from_secs(15);
/// Added by the autostart entry, so starting with Windows stays in the tray.
const MINIMIZED_ARG: &str = "--minimized";

/// Only size, position and maximized state are remembered. Visibility is decided
/// here, and decorations must stay off: the app draws its own caption buttons.
fn saved_state() -> StateFlags {
  StateFlags::SIZE | StateFlags::POSITION | StateFlags::MAXIMIZED
}

/// Debug builds accept MUSICGAME_RELEASE_AFTER_SECS to test the release quickly.
fn release_after() -> Duration {
  if !cfg!(debug_assertions) {
    return RELEASE_AFTER;
  }
  std::env::var("MUSICGAME_RELEASE_AFTER_SECS").ok().and_then(|s| s.parse().ok())
    .map(Duration::from_secs).unwrap_or(RELEASE_AFTER)
}

/// What the tray shows, sent by the app and kept on disk so the menu is right
/// even when the app starts in the tray and no window has loaded yet.
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct TrayState {
  language: String,
  /// "Continue: <topic>" or "Up next: <topic>", already translated.
  continue_label: Option<String>,
  /// False while a quiz round is running, so the tray cannot replace it.
  continue_enabled: bool,
  /// The close-to-tray note has been shown once.
  hint_shown: bool,
}

impl TrayState {
  fn text(&self, pt: &'static str, en: &'static str) -> &'static str {
    if self.language == "en" { en } else { pt }
  }
}

#[derive(Default)]
struct Shell {
  /// Bumped every time the window is shown; a pending release checks it.
  shown: AtomicU64,
  /// Where a newly built window should open; the app takes it once loaded.
  pending_route: Mutex<Option<String>>,
  tray: Mutex<TrayState>,
  /// The tray icon in use, as (light taskbar, size in pixels).
  tray_icon: Mutex<Option<(bool, u32)>>,
}

fn state_file<R: Runtime>(app: &AppHandle<R>) -> Option<PathBuf> {
  app.path().app_config_dir().ok().map(|dir| dir.join("tray.json"))
}

fn load_tray_state<R: Runtime>(app: &AppHandle<R>) -> TrayState {
  let mut state: TrayState = state_file(app).and_then(|path| std::fs::read(path).ok())
    .and_then(|bytes| serde_json::from_slice(&bytes).ok()).unwrap_or_default();
  // A new window decides again whether a quiz is running.
  state.continue_enabled = true;
  state
}

fn save_tray_state<R: Runtime>(app: &AppHandle<R>, state: &TrayState) {
  if let Some(path) = state_file(app) {
    if let Some(dir) = path.parent() {
      let _ = std::fs::create_dir_all(dir);
    }
    if let Ok(bytes) = serde_json::to_vec(state) {
      let _ = std::fs::write(path, bytes);
    }
  }
}

/// Shows the main window, building it again if it was released, and optionally
/// sends the app to a route such as "tuner" or "continue".
fn show_main<R: Runtime>(app: &AppHandle<R>, route: Option<&str>) {
  let shell = app.state::<Shell>();
  shell.shown.fetch_add(1, Ordering::SeqCst);
  if let Some(window) = app.get_webview_window(MAIN) {
    let _ = window.emit("shell-hidden", false);
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    if let Some(route) = route {
      let _ = window.emit("navigate", route);
    }
    return;
  }
  *shell.pending_route.lock().unwrap() = route.map(String::from);
  if let Err(error) = build_main(app) {
    eprintln!("could not open the main window: {error}");
  }
}

fn build_main<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<WebviewWindow<R>> {
  let config = app.config().app.windows.iter().find(|w| w.label == MAIN)
    .expect("tauri.conf.json defines the main window").clone();
  // The window starts hidden so it appears at its saved size and position.
  let window = WebviewWindowBuilder::from_config(app, &config)?.build()?;
  let _ = window.restore_state(saved_state());
  window.show()?;
  window.set_focus()?;
  Ok(window)
}

/// Hides the window to the tray and releases it if it stays hidden.
fn hide_main<R: Runtime>(window: &WebviewWindow<R>) {
  let app = window.app_handle().clone();
  let _ = app.save_window_state(saved_state());
  // The app pauses a running quiz round while it cannot be seen.
  let _ = window.emit("shell-hidden", true);
  let _ = window.hide();
  let generation = app.state::<Shell>().shown.load(Ordering::SeqCst);
  tauri::async_runtime::spawn(async move {
    tokio::time::sleep(release_after()).await;
    if app.state::<Shell>().shown.load(Ordering::SeqCst) != generation {
      return;
    }
    if let Some(window) = app.get_webview_window(MAIN) {
      if !window.is_visible().unwrap_or(true) {
        let _ = window.destroy();
      }
    }
  });
}

/// Close hides to the tray. The first time, the app shows a short note first.
fn close_to_tray<R: Runtime>(window: &WebviewWindow<R>) {
  let app = window.app_handle().clone();
  let first = {
    let shell = app.state::<Shell>();
    let mut tray = shell.tray.lock().unwrap();
    let first = !tray.hint_shown;
    if first {
      tray.hint_shown = true;
      save_tray_state(&app, &tray);
    }
    first
  };
  if !first {
    hide_main(window);
    return;
  }
  let _ = window.emit("tray-hint", ());
  let generation = app.state::<Shell>().shown.load(Ordering::SeqCst);
  tauri::async_runtime::spawn(async move {
    tokio::time::sleep(HINT_FOR).await;
    if app.state::<Shell>().shown.load(Ordering::SeqCst) == generation {
      if let Some(window) = app.get_webview_window(MAIN) {
        hide_main(&window);
      }
    }
  });
}

fn tray_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
  let tray = app.state::<Shell>().tray.lock().unwrap().clone();
  let autostart = app.autolaunch().is_enabled().unwrap_or(false);
  let continue_label = tray.continue_label.clone()
    .unwrap_or_else(|| tray.text("Continuar praticando", "Continue practicing").to_string());
  Menu::with_items(app, &[
    &MenuItem::with_id(app, "open", tray.text("Abrir musicgame", "Open musicgame"), true, None::<&str>)?,
    &MenuItem::with_id(app, "continue", continue_label, tray.continue_enabled, None::<&str>)?,
    &MenuItem::with_id(app, "tuner", tray.text("Afinador", "Tuner"), true, None::<&str>)?,
    &PredefinedMenuItem::separator(app)?,
    &CheckMenuItem::with_id(app, "autostart", tray.text("Iniciar com o Windows", "Start with Windows"), true, autostart, None::<&str>)?,
    &PredefinedMenuItem::separator(app)?,
    &MenuItem::with_id(app, "quit", tray.text("Sair", "Quit"), true, None::<&str>)?,
  ])
}

fn refresh_tray<R: Runtime>(app: &AppHandle<R>) {
  let Some(icon) = app.tray_by_id(TRAY) else { return };
  if let Ok(menu) = tray_menu(app) {
    let _ = icon.set_menu(Some(menu));
  }
  let tray = app.state::<Shell>().tray.lock().unwrap().clone();
  let tooltip = match tray.continue_label {
    Some(label) => format!("musicgame\n{label}"),
    None => "musicgame".to_string(),
  };
  let _ = icon.set_tooltip(Some(tooltip));
}

/// True when the taskbar is light; it follows the system theme, not the app's.
#[cfg(windows)]
fn light_taskbar() -> bool {
  use winreg::enums::HKEY_CURRENT_USER;
  winreg::RegKey::predef(HKEY_CURRENT_USER)
    .open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize")
    .and_then(|key| key.get_value::<u32, _>("SystemUsesLightTheme"))
    .map(|value| value == 1)
    .unwrap_or(false)
}

#[cfg(not(windows))]
fn light_taskbar() -> bool {
  false
}

/// The tray icon for the taskbar theme, in the size Windows draws at this display scaling.
fn tray_icon_for<R: Runtime>(app: &AppHandle<R>) -> (bool, u32) {
  let scale = app.primary_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0);
  let size = if scale <= 1.0 { 16 } else if scale <= 1.25 { 20 } else if scale <= 1.5 { 24 } else { 32 };
  (light_taskbar(), size)
}

fn tray_image((light, size): (bool, u32)) -> Image<'static> {
  let bytes: &'static [u8] = match (light, size) {
    (false, 16) => include_bytes!("../icons/tray-dark-16.png"),
    (false, 20) => include_bytes!("../icons/tray-dark-20.png"),
    (false, 24) => include_bytes!("../icons/tray-dark-24.png"),
    (false, _) => include_bytes!("../icons/tray-dark-32.png"),
    (true, 16) => include_bytes!("../icons/tray-light-16.png"),
    (true, 20) => include_bytes!("../icons/tray-light-20.png"),
    (true, 24) => include_bytes!("../icons/tray-light-24.png"),
    (true, _) => include_bytes!("../icons/tray-light-32.png"),
  };
  Image::from_bytes(bytes).expect("tray icons are valid PNG files")
}

/// Swaps the tray icon when the taskbar theme or the display scaling changes.
fn update_tray_icon<R: Runtime>(app: &AppHandle<R>) {
  let wanted = tray_icon_for(app);
  let shell = app.state::<Shell>();
  let mut current = shell.tray_icon.lock().unwrap();
  if *current == Some(wanted) {
    return;
  }
  if let Some(icon) = app.tray_by_id(TRAY) {
    if icon.set_icon(Some(tray_image(wanted))).is_ok() {
      *current = Some(wanted);
    }
  }
}

fn set_autostart<R: Runtime>(app: &AppHandle<R>, enabled: bool) -> Result<(), String> {
  let launcher = app.autolaunch();
  let result = if enabled { launcher.enable() } else { launcher.disable() };
  refresh_tray(app);
  result.map_err(|e| e.to_string())
}

/// The route a newly built window should open, if the tray asked for one.
#[tauri::command]
fn take_pending_route(shell: tauri::State<'_, Shell>) -> Option<String> {
  shell.pending_route.lock().unwrap().take()
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TrayUpdate {
  language: String,
  continue_label: String,
  continue_enabled: bool,
}

/// The app's language and recommended topic, for the tray menu and tooltip.
#[tauri::command]
fn set_tray_state<R: Runtime>(app: AppHandle<R>, update: TrayUpdate) {
  {
    let shell = app.state::<Shell>();
    let mut tray = shell.tray.lock().unwrap();
    let changed_on_disk = tray.language != update.language || tray.continue_label.as_deref() != Some(&update.continue_label);
    tray.language = update.language;
    tray.continue_label = Some(update.continue_label);
    tray.continue_enabled = update.continue_enabled;
    if changed_on_disk {
      save_tray_state(&app, &tray);
    }
  }
  refresh_tray(&app);
}

#[tauri::command]
fn autostart_enabled<R: Runtime>(app: AppHandle<R>) -> bool {
  app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
fn set_autostart_enabled<R: Runtime>(app: AppHandle<R>, enabled: bool) -> Result<(), String> {
  set_autostart(&app, enabled)
}

pub fn run() {
  tauri::Builder::default()
    // Must come first: a second launch only brings the running app forward.
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app, None)))
    .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec![MINIMIZED_ARG])))
    .plugin(tauri_plugin_window_state::Builder::default().with_state_flags(saved_state()).build())
    .manage(Shell::default())
    .invoke_handler(tauri::generate_handler![take_pending_route, set_tray_state, autostart_enabled, set_autostart_enabled])
    .setup(|app| {
      let handle = app.handle();
      *handle.state::<Shell>().tray.lock().unwrap() = load_tray_state(handle);
      let icon = tray_icon_for(handle);
      TrayIconBuilder::with_id(TRAY)
        .icon(tray_image(icon))
        .tooltip("musicgame")
        .menu(&tray_menu(handle)?)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "open" => show_main(app, None),
          "continue" => show_main(app, Some("continue")),
          "tuner" => show_main(app, Some("tuner")),
          "autostart" => {
            let enabled = app.autolaunch().is_enabled().unwrap_or(false);
            let _ = set_autostart(app, !enabled);
          }
          "quit" => app.exit(0),
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
            show_main(tray.app_handle(), None);
          }
        })
        .build(app)?;
      *handle.state::<Shell>().tray_icon.lock().unwrap() = Some(icon);
      refresh_tray(handle);
      let watcher = handle.clone();
      tauri::async_runtime::spawn(async move {
        loop {
          tokio::time::sleep(THEME_CHECK).await;
          update_tray_icon(&watcher);
        }
      });
      if !std::env::args().any(|arg| arg == MINIMIZED_ARG) {
        show_main(handle, None);
      }
      Ok(())
    })
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == MAIN {
          api.prevent_close();
          if let Some(webview) = window.app_handle().get_webview_window(MAIN) {
            close_to_tray(&webview);
          }
        }
      }
    })
    .build(tauri::generate_context!())
    .expect("error while building the musicgame desktop app")
    .run(|_app, event| {
      // Destroying the last window would otherwise quit; only Quit (an explicit exit code) does.
      if let RunEvent::ExitRequested { code: None, api, .. } = event {
        api.prevent_exit();
      }
    });
}
