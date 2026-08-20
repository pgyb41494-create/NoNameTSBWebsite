import { NavLink } from "react-router-dom";
import { brand } from "../api";
import { useAuth } from "../auth";
import { BoardAvatar } from "./BoardAvatar";

export function Navbar() {
  const { user, loading, loginUrl, logout } = useAuth();

  return (
    <header className="nav-bar">
      <div className="nav-inner">
        <div className="nav-edge nav-edge-left">
          <NavLink className="nav-brand" to="/" end>
            <img src={brand.icon} alt="" />
            {brand.name}
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/trainers">Trainers</NavLink>
            <NavLink to="/blacklist">Blacklist</NavLink>
            {user ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
            {user ? <NavLink to="/report">Report</NavLink> : null}
          </nav>
        </div>
        <div className="nav-edge nav-actions">
          {!loading && user ? (
            <button type="button" className="btn ghost user-chip" onClick={logout}>
              <BoardAvatar src={user.avatar} userId={user.id} className="nav-avatar" />
              {user.username}
            </button>
          ) : (
            <a className="nav-text" href={loginUrl}>
              Login
            </a>
          )}
          <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
            Invite
          </a>
        </div>
      </div>
    </header>
  );
}
