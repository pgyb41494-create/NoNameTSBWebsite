import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, brand } from "../api";
import { useAuth } from "../auth";
import { BoardAvatar } from "../components/BoardAvatar";

const OWNERS = ["1515419032520626261", "1196512159266504797"];

const FEATURES = [
  { title: "Server setup", text: "Type 'serversetup and turn on leaderboard, ranking, score, or lineup." },
  { title: "/profile", text: "Link your Roblox account. Boards and the coach pull from that." },
  { title: "Verification", text: "Staff post a panel. People prove their Roblox in a ticket, then you approve them." },
  { title: "TSB coach", text: "/tsbcoach watches a clip, checks the name against /profile, and tells you what to fix." },
];

const STEPS = [
  { title: "Invite", text: "Add Ascendant to your server." },
  { title: "Log in", text: "Open the dashboard and pick that server." },
  { title: "Setup", text: "Run 'serversetup for boards. Use the dashboard for verify and panels." },
];

export default function Home() {
  const { user, loading, loginUrl } = useAuth();
  const [params, setParams] = useSearchParams();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    if (![...params.keys()].length) return;
    setParams({}, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    api.stats().then((s) => {
      const n = Number(s?.players || s?.memberTotal || 0);
      setPeople(Number.isFinite(n) ? n : 0);
    });
  }, []);

  const dashHref = user ? "/dashboard" : loginUrl;
  const dashIsLink = Boolean(user);

  return (
    <div className="home-page">
      <section className="wrap home-hero">
        <div className="home-hero-copy">
          <h1 className="home-hero-brand">{brand.name}</h1>
          <p className="home-hero-title">TSB bot for Discord clans.</p>
          <p className="home-hero-lead">
            Leaderboards, lineup, ranking, verify, and a clip coach. Most of it is set up in Discord. The rest is on the dashboard.
          </p>
          <div className="home-hero-actions">
            <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
              Add to Discord
            </a>
            {dashIsLink ? (
              <Link className="home-text-cta" to="/dashboard">
                Open dashboard →
              </Link>
            ) : (
              <a className="home-text-cta" href={loading ? undefined : loginUrl}>
                Log in →
              </a>
            )}
          </div>
        </div>
        <div className="home-hero-visual">
          <div className="home-owners">
            {OWNERS.map((id) => (
              <a
                key={id}
                className="home-owner"
                href={`https://discord.com/users/${id}`}
                target="_blank"
                rel="noreferrer"
              >
                <BoardAvatar userId={id} className="home-owner-pfp" alt="" />
                <span className="home-owner-id">{id}</span>
              </a>
            ))}
            <p className="home-owner-role">Bot owner</p>
            <p className="home-owner-users">
              {people == null ? "—" : people.toLocaleString()} people use the bot
            </p>
          </div>
        </div>
      </section>

      <section className="wrap home-block">
        <p className="home-kicker">Dashboard</p>
        <h2 className="home-block-title">Pick a server and edit it.</h2>
        <p className="home-block-body">
          Log in, pick a server you admin, and edit verify, panels, audit logs, and invites from there.
        </p>
      </section>

      <section className="wrap home-block">
        <p className="home-kicker">In Discord</p>
        <h2 className="home-block-title">What you can turn on</h2>
        <ul className="home-rail">
          {FEATURES.map((item, index) => (
            <li key={item.title}>
              <span className="home-rail-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap home-block">
        <p className="home-kicker">Setup</p>
        <h2 className="home-block-title">How to add it</h2>
        <ol className="home-start">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="home-start-step">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap home-close">
        <div className="home-close-actions">
          <a className="btn" href={brand.invite} target="_blank" rel="noreferrer">
            Add to Discord
          </a>
          {dashIsLink ? (
            <Link className="home-text-cta" to={dashHref}>
              Open dashboard →
            </Link>
          ) : (
            <a className="home-text-cta" href={loginUrl}>
              Log in →
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
