// src/components/ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              color: '#ff6b6b'
            }}>
            </div>
            
            <h2 style={{ 
              marginBottom: '15px', 
              color: '#212529' 
            }}>
              Something went wrong
            </h2>
            
            <p style={{ 
              color: '#6c757d', 
              marginBottom: '25px',
              lineHeight: 1.5 
            }}>
              {this.state.error?.message || 'An unexpected error occurred in the application.'}
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#4361ee',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: '#e9ecef',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Reload Page
              </button>
            </div>

            <button
              onClick={() => {
                this.setState(prev => ({ showDetails: !prev.showDetails }));
              }}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#6c757d',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '15px'
              }}
            >
              {this.state.showDetails ? 'Hide Details' : 'Show Error Details'}
            </button>

            {this.state.showDetails && this.state.errorInfo && (
              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '6px',
                fontSize: '12px',
                textAlign: 'left',
                marginTop: '15px',
                maxHeight: '200px',
                overflow: 'auto',
                fontFamily: 'monospace'
              }}>
                <div style={{ color: '#dc3545', marginBottom: '10px' }}>
                  Error: {this.state.error?.toString()}
                </div>
                <div style={{ color: '#6c757d' }}>
                  Component Stack:
                  <pre style={{ 
                    margin: '10px 0 0 0', 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            )}

            <div style={{ 
              marginTop: '25px', 
              paddingTop: '20px',
              borderTop: '1px solid #e9ecef',
              fontSize: '13px',
              color: '#6c757d'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>Need help?</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '8px 16px',
                    background: '#e9ecef',
                    color: '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Go to Home
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '8px 16px',
                    background: '#e9ecef',
                    color: '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;