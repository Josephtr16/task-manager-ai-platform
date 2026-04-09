import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const { onError } = this.props;

    if (typeof onError === 'function') {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  renderDefaultFallback() {
    const { error } = this.state;
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
      <div
        style={{
          minHeight: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '680px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e8e8e4',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>Error</div>
          <h2 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Something went wrong in this section.</h2>

          {isDevelopment && error ? (
            <pre
              style={{
                margin: '14px 0 20px 0',
                padding: '12px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                background: '#f7f7f2',
                borderRadius: '10px',
                border: '1px solid #e8e8e4',
                color: '#374151',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '12px',
              }}
            >
              {error.message}
            </pre>
          ) : null}

          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              background: '#111827',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  render() {
    const { fallback, children } = this.props;
    const { hasError, error } = this.state;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      if (React.isValidElement(fallback)) {
        return fallback;
      }

      if (typeof fallback === 'function') {
        const FallbackComponent = fallback;
        return <FallbackComponent error={error} onRetry={this.handleRetry} />;
      }
    }

    return this.renderDefaultFallback();
  }
}

export default ErrorBoundary;
