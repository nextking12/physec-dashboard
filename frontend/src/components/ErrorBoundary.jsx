import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="login-shell">
          <section className="login-frame restoring">
            <div className="error-banner">
              <AlertTriangle size={18} />
              Something went wrong. Refresh the page to try again.
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
