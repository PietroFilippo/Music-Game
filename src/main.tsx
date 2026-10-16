import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { isDesktop } from './desktop/DesktopBridge';
import './styles.css';

// Desktop-only layout rules (frameless window, caption buttons) hang off this class.
if (isDesktop()) document.documentElement.classList.add('desktop');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
