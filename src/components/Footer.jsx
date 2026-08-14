import { brand } from "../api";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <strong>{brand.name}</strong> · The Strongest Battlegrounds
      </div>
    </footer>
  );
}
