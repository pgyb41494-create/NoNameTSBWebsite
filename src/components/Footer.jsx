import { Link } from "react-router-dom";
import { brand } from "../api";

export function Footer() {
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
          <Link to="/blacklist">Blacklisted</Link>
          <Link to="/trainers">Trainers</Link>
          <Link to="/report">Report</Link>
        </nav>
      </div>
    </footer>
  );
}
