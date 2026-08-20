import { brand } from "../api";
import { useAuth } from "../auth";

export function LoginGate({ children }) {
  const { user, loading, loginUrl } = useAuth();

  if (loading) {
    return (
      <div className="login-gate">
        <p className="sub">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-gate">
        <div className="login-card">
          <img src={brand.icon} alt="" />
          <h1>Log in</h1>
          <p className="lead">Discord login is required to continue.</p>
          <a className="btn btn-discord" href={loginUrl}>
            Continue with Discord
          </a>
        </div>
      </div>
    );
  }

  return children;
}
