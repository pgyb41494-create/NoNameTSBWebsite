import { useAuth } from "../auth";

export function LoginGate({ children }) {
  const { user, loading, loginUrl } = useAuth();

  if (loading) {
    return (
      <div className="login-gate">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-gate">
        <div className="login-card">
          <p className="kicker">Strongest Battlegrounds · Competitive</p>
          <h1>Log in to continue</h1>
          <p className="lead">Discord login is required to view blacklisted players, trainers, and submit reports.</p>
          <a className="btn btn-discord" href={loginUrl}>
            Log in with Discord
          </a>
        </div>
      </div>
    );
  }

  return children;
}
