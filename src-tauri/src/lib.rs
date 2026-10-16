// The desktop shell: a tray icon that stays resident and a main window that
// exists only while it is used. Closing the window hides it to the tray; after
// RELEASE_AFTER hidden, the window and its web view are destroyed, so the idle
// app costs a few megabytes instead of a running browser engine. Opening it
// again rebuilds the window. Answers and scores are saved as they happen, so
// destroying the web view loses nothing but an unfinished quiz.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, RunEvent, Runtime, WebviewWindow, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_window_state::{AppHandleExt, StateFlags, WindowExt};

const MAIN: &str = "main";
const TRAY: &str = "tray";
/// How long a hidden window keeps its web view before it is destroyed.
const RELEASE_AFTER: Duration = Duration::from_secs(5 * 60);

/// Debug builds accept MUSICGAME_RELEASE_AFTER_SECS to test the release quickly.
fn release_after() -> Duration {
  if !cfg!(debug_assertions) {
    return RELEASE_AFTER;
  }
  std::env::var("MUSICGAME_RELEASE_AFTER_SECS").ok().and_then(|s| s.parse().ok())
    .map(Duration::from_secs).unwrap_or(RELEASE_AFTER)
}
/// Added by the autostart entry, so starting with Windows stays in the tray.
const MINIMIZED_ARG: &str = "--minimized";
/// Size, position and maximized state are remembered; visibility is decided here.
fn saved_state() -> StateFlags {
  StateFlags::all() - StateFlags::VISIBLE
}

#[derive(Default)]
struct Shell {
  /// Bumped every time the window is shown; a pending release checks it.
  shown: AtomicU64,
  /// Where a newly built window should open; the app takes it once loaded.
  pending_route: Mutex<Option<String>>,
  /// Language of the tray menu, following the app's setting.
  language: Mutex<Language>,
}

#[derive(Clone, Copy, Default, PartialEq)]
enum Language {
  #[default]
  Pt,
  En,
}

impl Language {
  fn parse(code: &str) -> Self {
    if code == "en" { Language::En } else { Language::Pt }
  }

  fn text(self, pt: &'static str, en: &'static str) -> &'static str {
    if self == Language::En { en } else { pt }
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

fn tray_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
  let lang = *app.state::<Shell>().language.lock().unwrap();
  let autostart = app.autolaunch().is_enabled().unwrap_or(false);
  Menu::with_items(app, &[
    &MenuItem::with_id(app, "open", lang.text("Abrir musicgame", "Open musicgame"), true, None::<&str>)?,
    &MenuItem::with_id(app, "continue", lang.text("Continuar praticando", "Continue practicing"), true, None::<&str>)?,
    &MenuItem::with_id(app, "tuner", lang.text("Afinador", "Tuner"), true, None::<&str>)?,
    &PredefinedMenuItem::separator(app)?,
    &CheckMenuItem::with_id(app, "autostart", lang.text("Iniciar com o Windows", "Start with Windows"), true, autostart, None::<&str>)?,
    &PredefinedMenuItem::separator(app)?,
    &MenuItem::with_id(app, "quit", lang.text("Sair", "Quit"), true, None::<&str>)?,
  ])
}

fn refresh_tray<R: Runtime>(app: &AppHandle<R>) {
  if let (Some(tray), Ok(menu)) = (app.tray_by_id(TRAY), tray_menu(app)) {
    let _ = tray.set_menu(Some(menu));
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

/// Follows the app's language setting in the tray menu.
#[tauri::command]
fn set_tray_language<R: Runtime>(app: AppHandle<R>, language: String) {
  *app.state::<Shell>().language.lock().unwrap() = Language::parse(&language);
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
    .invoke_handler(tauri::generate_handler![take_pending_route, set_tray_language, autostart_enabled, set_autostart_enabled])
    .setup(|app| {
      let handle = app.handle();
      TrayIconBuilder::with_id(TRAY)
        .icon(app.default_window_icon().cloned().expect("the bundle has an icon"))
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
            hide_main(&webview);
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
