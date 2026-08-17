import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { brand } from "../api";
import { useAuth } from "../auth";

const FEATURES = [
  { title: "Server setup", text: "Admins run 'serversetup in Discord and pick leaderboard, ranking, score, or lineup." },
  { title: "/profile", text: "Roblox-linked player cards. Same data feeds boards, lineups, and the coach." },
  { title: "Verification", text: "Staff post a panel. Members prove their Roblox from /profile, then get approved in a ticket." },
  { title: "TSB AI Coach", text: "/tsbcoach watches a clip, checks the username against /profile, then tells you what to improve." },
];

const STEPS = [
  { title: "Invite", text: "Add Ascendant and accept the permissions it asks for." },
  { title: "Log in", text: "Open the dashboard, pick your server, then save verification and staff tools." },
  { title: "Setup", text: "Admins can run 'serversetup in Discord for boards, ranking, score, and lineup." },
];

export default function Home() {
  const { user, loading, loginUrl } = useAuth();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (![...params.keys()].length) return;
    setParams({}, { replace: true });
  }, [params, setParams]);

  const dashHref = user ? "/dashboard" : loginUrl;
  const dashIsLink = Boolean(user);

  return (
    <div className="home-page">
      <section className="wrap home-hero">
        <div className="home-hero-copy">
          <h1 className="home-hero-brand">{brand.name}</h1>
          <p className="home-hero-title">Ops for TSB clans that actually run.</p>
          <p className="home-hero-lead">
            Profiles, boards, lineups, verification, and an AI coach — configured in Discord and the dashboard, not buried in commands.
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
          <div className="home-hero-mark">
            <img src={brand.gif} alt="" />
          </div>
          <p className="home-hero-caption">The Strongest Battlegrounds</p>
        </div>
      </section>

      <section className="wrap home-block">
        <p className="home-kicker">Dashboard · Setup · Clan</p>
        <h2 className="home-block-title">Server tools live here.</h2>
        <p className="home-block-body">
          Sign in with Discord to open the dashboard, invite the bot, and configure verification for servers you admin.
        </p>
      </section>

      <section className="wrap home-block">
        <p className="home-kicker">In Discord</p>
        <h2 className="home-block-title">What it runs</h2>
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
        <p className="home-kicker">Start here</p>
        <h2 className="home-block-title">Three steps to get going.</h2>
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
        <p>Built for clans that stay online.</p>
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
