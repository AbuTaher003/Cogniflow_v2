"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-6">
          <Card className="max-w-md border-rose-500/20 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_50px_rgba(244,63,94,0.08)]">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-white font-bold">Something went wrong</CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                An unexpected error occurred in this workspace view.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <p className="text-xs text-slate-500 max-h-[80px] overflow-y-auto w-full font-mono bg-white/5 p-3 rounded-xl border border-white/5">
                {this.state.error?.message || "Unknown error details"}
              </p>
              <Button onClick={this.handleReset} variant="primary" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" /> Reload Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
