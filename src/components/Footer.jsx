import { Link } from "react-router-dom";
import { brand } from "../api";
import { useAuth } from "../auth";

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <img src={brand.gif} alt="" />
          <span>
            © {new Date().getFullYear()} {brand.name} · The Strongest Battlegrounds
          </span>
        </div>
        <nav className="footer-links">
          <Link to="/trainers">Trainers</Link>
          {user ? <Link to="/dashboard">Dashboard</Link> : null}
          {user ? <Link to="/report">Report</Link> : null}
        </nav>
      </div>
    </footer>
  );
}
