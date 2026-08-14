import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, brand } from "../api";

export default function Home() {
  const [stats, setStats] = useState({ players: 0, servers: 0, wars: 0 });
  const [params, setParams] = useSearchParams();
  const loginState = params.get("login");

  useEffect(() => {
    api.stats().then(setStats);
  }, []);

  useEffect(() => {
    if (!loginState) return;
    // Clean URL to bare homepage shortly after showing the banner
    const t = setTimeout(() => setParams({}, { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [loginState, setParams]);

  return (
    <div>
      <section className="hero">
        <div className="wrap">
          {loginState === "error" ? (
            <p className="banner banner-danger">Login failed. Try again.</p>
          ) : null}
          {loginState === "ok" ? <p className="banner banner-ok">Logged in.</p> : null}
          <div className="kicker">Strongest Battlegrounds · Competitive</div>
          <p className="lead">A Discord bot for TSB clans — profiles, boards, lineups, trainers, and an AI coach.</p>
          <div className="hero-actions">
            <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
              Add bot
            </a>
            <Link className="btn ghost" to="/trainers">
              Trainers
            </Link>
          </div>
          <div className="stats stats-two">
            <div className="stat">
              <b>{stats.players}</b>
              <span>Players</span>
            </div>
            <div className="stat">
              <b>{stats.servers}</b>
              <span>Servers</span>
            </div>
          </div>
        </div>
      </section>
      <section className="wrap page" style={{ paddingTop: 12 }}>
        <div className="features">
          <article className="feature">
            <h3>Server setup</h3>
            <p>Admins run 'serversetup in Discord and pick leaderboard, ranking, score, or lineup.</p>
          </article>
          <article className="feature">
            <h3>/profile</h3>
            <p>Roblox-linked player cards. Same data feeds boards, lineups, and the coach.</p>
          </article>
          <article className="feature">
            <h3>TSB AI Coach</h3>
            <p>/tsbcoach watches a clip, checks the username/avatar against /profile, then tells you what to improve.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
