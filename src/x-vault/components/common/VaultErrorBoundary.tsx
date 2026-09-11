import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VaultErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VaultErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900 border border-rose-500/30 rounded-2xl text-center flex flex-col items-center justify-center max-w-xl mx-auto my-12 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {this.props.fallbackTitle || "Erreur d'affichage de la section"}
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-md">
            Une exception inattendue s'est produite lors du rendu des données. Le reste de la plateforme X-Vault reste pleinement opérationnel.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-rose-300/80 mb-6 max-w-md break-all">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer l'affichage</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
