import { NavLink } from "react-router-dom";
import { brand } from "../api";
import { useAuth } from "../auth";

export function Navbar() {
  const { user, loading, loginUrl, logout } = useAuth();

  return (
    <header className="nav-bar">
      <div className="nav-inner">
        <div className="nav-edge nav-edge-left" aria-hidden="true" />
        <nav className="nav-links">
          <NavLink to="/blacklist">Blacklisted</NavLink>
          <NavLink to="/trainers">Trainers</NavLink>
          <NavLink to="/wars">Wars</NavLink>
        </nav>
        <div className="nav-edge nav-edge-right nav-actions">
          <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
            Add bot
          </a>
          {!loading && user ? (
            <>
              <NavLink className="btn ghost" to="/dashboard">
                Dashboard
              </NavLink>
              <button type="button" className="btn ghost user-chip" onClick={logout}>
                {user.avatar ? <img src={user.avatar} alt="" /> : null}
                {user.username}
              </button>
            </>
          ) : (
            <a className="btn btn-discord" href={loginUrl}>
              Log in with Discord
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
