import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Error caught by Boundary:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    backgroundColor: '#fff',
                    color: '#000',
                    minHeight: '100vh',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    border: '10px solid #ff0000'
                }}>
                    <h1 style={{ color: '#ff0000', fontSize: '3rem', margin: '0 0 20px 0' }}>🚨 SYSTEM CRASH</h1>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Something went wrong while rendering the app.</p>
                    <hr style={{ border: '2px solid #eee', margin: '30px 0' }} />
                    <h2 style={{ color: '#555' }}>Error Details:</h2>
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '20px',
                        fontSize: '1rem'
                    }}>
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <h2 style={{ color: '#555' }}>Stack Trace:</h2>
                    <pre style={{
                        padding: '20px',
                        backgroundColor: '#f1f3f5',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        lineHeight: '1.4'
                    }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '30px',
                            padding: '15px 30px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;



