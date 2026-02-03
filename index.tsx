
import React from 'react';
import ReactDOM from 'react-dom/client';

// Baseline runtime logging to surface silent failures (especially on Cordova/WKWebView)
const logBoot = () => {
  const cordovaPresent = typeof (window as any).cordova !== 'undefined';
  console.log('[Riingr] boot', {
    cordovaPresent,
    href: window.location.href,
    userAgent: navigator.userAgent,
  });
  document.addEventListener(
    'deviceready',
    () => console.log('[Riingr] deviceready fired'),
    { once: true }
  );
};

// Global error surfaces
window.addEventListener('error', (e) => {
  console.error('[Riingr] Global error', e.error || e.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Riingr] Unhandled rejection', e.reason || e);
});

logBoot();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

const renderFatal = (error: unknown) => {
  console.error('❌ Failed to bootstrap app:', error);
  root.render(
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Error Loading App</h1>
      <p>Please check the console for details.</p>
      <pre>{String(error)}</pre>
    </div>
  );
};

const bootstrap = async () => {
  try {
    const { default: App } = await import('./App');
    const { ErrorBoundary } = await import('./components/ErrorBoundary');
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('🚀 Riingr Messenger app starting...');
  } catch (error) {
    renderFatal(error);
  }
};

bootstrap();
