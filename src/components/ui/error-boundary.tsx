'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary robusto para capturar errores técnicos y ofrecer recuperación.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AddContent Contingency] Error capturado en UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-red-100 bg-red-50/30 p-12 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle className="h-8 i-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--mc-ink)]">Algo no salió como esperábamos</h2>
          <p className="mb-8 max-w-md text-[var(--mc-slate)]">
            El Maquetador ha encontrado un error inesperado al renderizar. No te preocupes, tus cambios locales suelen guardarse automáticamente.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[var(--mc-ink)] px-6"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Recargar página
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/admin'}
              className="rounded-xl border-[var(--mc-dust-taupe)]"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 max-w-full overflow-auto rounded-lg bg-black/5 p-4 text-left text-xs text-red-800">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
