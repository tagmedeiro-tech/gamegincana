import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastContext';
import { AppThemeProvider } from './context/AppThemeContext';
import { hideSplash, showStatusBar } from './lib/nativeCapabilities';

// ─── Bootstrap nativo (no-ops em ambiente web) ────────────────────────────────
const bootstrap = async () => {
  await showStatusBar();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ToastProvider>
        <AuthProvider>
          <AppThemeProvider>
            <App />
          </AppThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </StrictMode>,
  );

  // Oculta o splash depois que o React montou
  setTimeout(hideSplash, 300);
};

bootstrap();
