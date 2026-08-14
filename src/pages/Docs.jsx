import { brand } from "../api";

export default function Docs() {
  const p = "'";
  return (
    <section className="wrap page">
      <h1>Docs</h1>
      <p className="sub">Prefix is {p} — same commands also exist as slash.</p>
      <article className="list-card">
        <h3>Setup</h3>
        <p>
          {p}serversetup — admin hub for leaderboard, ranking, score, lineup, blacklist, trainers.
        </p>
      </article>
      <br />
      <article className="list-card">
        <h3>Profile & coach</h3>
        <p>
          /profile — create and verify Roblox.
          <br />
          /tsbcoach — upload a clip or paste a link. Username and avatar must match /profile.
        </p>
      </article>
      <br />
      <article className="list-card">
        <h3>Boards</h3>
        <p>
          {p}tsbtop 1 @user · {p}lineup add na 1 @user · {p}stage @user 0 Low Weak · /score
        </p>
      </article>
      <br />
      <article className="list-card">
        <h3>Moderation</h3>
        <p>/kick /ban /unban /timeout /purge /serverinfo /userinfo /avatar</p>
      </article>
      <p className="sub" style={{ marginTop: 24 }}>
        {brand.name} name is a placeholder — change BOT_NAME in .env whenever you pick one.
      </p>
    </section>
  );
}
