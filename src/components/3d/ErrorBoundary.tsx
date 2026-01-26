// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm p-4 text-center">
                    <div>
                        <p className="font-bold mb-1">3D View Error</p>
                        <p>{this.state.error?.message}</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
