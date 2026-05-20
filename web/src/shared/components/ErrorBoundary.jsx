import React, { Component } from 'react';

export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[UI Error Boundary] Render failure detected:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>An unexpected display error has occurred.</h2>
          <p>Your data is safe. Please refresh the page or return to the homepage.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '10px 20px', cursor: 'pointer', marginRight: '10px' }}
          >
            Try Again
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Return to Homepage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
