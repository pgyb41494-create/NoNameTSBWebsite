import { NavLink } from "react-router-dom";
import { brand } from "../api";

export function Navbar() {
  return (
    <header className="wrap nav">
      <NavLink to="/" className="nav-brand">
        {brand.name}
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/leaderboard">Leaderboard</NavLink>
        <NavLink to="/lineup">Lineup</NavLink>
        <NavLink to="/blacklist">Blacklisted</NavLink>
        <NavLink to="/trainers">Trainers</NavLink>
        <NavLink to="/wars">Wars</NavLink>
        <NavLink to="/docs">Docs</NavLink>
      </nav>
      <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
        Add bot
      </a>
    </header>
  );
}
