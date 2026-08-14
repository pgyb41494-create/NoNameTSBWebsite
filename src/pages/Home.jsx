import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, brand } from "../api";

export default function Home() {
  const [stats, setStats] = useState({ players: 0, servers: 0, wars: 0 });

  useEffect(() => {
    api.stats().then(setStats);
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="wrap">
          <div className="kicker">Strongest Battlegrounds · Competitive</div>
          <h1>{brand.name}</h1>
          <p className="lead">A Discord bot for TSB clans — profiles, boards, lineups, trainers, and an AI coach.</p>
          <div className="hero-actions">
            <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
              Add bot
            </a>
            <Link className="btn ghost" to="/leaderboard">
              Leaderboard
            </Link>
          </div>
          <div className="stats">
            <div className="stat">
              <b>{stats.players}</b>
              <span>Players</span>
            </div>
            <div className="stat">
              <b>{stats.wars}</b>
              <span>Wars</span>
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
            <p>/tsbcoach watches a clip, checks the username/avatar against /profile, then tells you what to fix.</p>
          </article>
          <article className="feature">
            <h3>Public boards</h3>
            <p>Leaderboard and lineup cards match the Discord GIF layout — rank, ID, mention, stage, W/L.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
