import React from "react";
import { Button, Result } from "antd";

/**
 * Catches render errors below it so one broken card or page shows a message instead of a
 * blank screen. `resetKey` (for example the route path) clears the error when it changes.
 *
 *   <ErrorBoundary resetKey={location.pathname}>…</ErrorBoundary>
 *   <ErrorBoundary compact>…</ErrorBoundary>   // inline, for a card or panel
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Render error", error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.reset();
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    const { children, compact, title, fallback } = this.props;
    if (!error) return children;
    if (fallback) return typeof fallback === "function" ? fallback({ error, reset: this.reset }) : fallback;
    if (compact) {
      return (
        <div role="alert" className="tm-error-inline">
          <span>{title || "This part of the page couldn't be shown."}</span>{" "}
          <Button size="small" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return (
      <Result
        status="error"
        title={title || "Something went wrong on this page"}
        subTitle="The rest of TalkMotion still works. Try again, or go back to the dashboard."
        extra={[
          <Button key="retry" type="primary" onClick={this.reset}>
            Try again
          </Button>,
          <Button key="home" href="/dashboard">
            Dashboard
          </Button>,
        ]}
      />
    );
  }
}
