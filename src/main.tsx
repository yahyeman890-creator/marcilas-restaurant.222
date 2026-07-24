import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './index.css';

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element #root not found in HTML');

  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );

  // Hide the loading indicator once React has rendered
  requestAnimationFrame(() => {
    if (typeof window !== 'undefined' && (window as any).__appReady) {
      (window as any).__appReady();
    }
  });
} catch (err) {
  console.error('Failed to render app:', err);
  const showError = (window as any).showError;
  if (showError) {
    showError(err instanceof Error ? err.message + '\n\n' + err.stack : String(err));
  }
}
