import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('App error:', error, info);
    const showError = (window as unknown as { showError?: (msg: string) => void }).showError;
    if (showError) {
      showError(error.message + '\n\nComponent stack:\n' + info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: 500, width: '100%', background: 'white', borderRadius: 16, border: '1px solid #fecaca', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#991b1b', fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem' }}>The app encountered an unexpected error.</p>
            <pre style={{ textAlign: 'left', background: '#f9fafb', borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem', color: '#dc2626', overflow: 'auto', maxHeight: 200, margin: '0 0 1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 12, padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
