import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-[#f3f4f6] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            ⚠️
          </div>
          <h1 className="text-xl font-display font-black text-white uppercase tracking-tight mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-400 text-xs font-mono max-w-md mb-6 break-words">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-full bg-[#C0FF00] text-black font-bold font-sans text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
