'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Keeps a single tool's runtime error from blanking the whole app. */
export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-card border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            This tool hit an unexpected error.
          </p>
          <p className="mt-2 font-mono text-xs text-danger/80">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-3 rounded-btn border border-danger/40 px-3 py-1.5 text-xs text-danger transition hover:bg-danger/15"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
