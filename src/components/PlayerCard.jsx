export function PlayerCard({ card, gif }) {
  const src = card.avatarUrl || gif;
  const isGif = String(src || "").includes(".gif");
  return (
    <article className="player-card">
      <div>
        <h2>
          #{card.position} {card.name}
        </h2>
        <div className="meta">ID: {card.id ?? "—"}</div>
        {card.discordTag ? <div className="mention">{card.discordTag}</div> : null}
        <div className="handle">&lt;&lt; | {card.robloxTag || ".???."} | &gt;&gt;</div>
        <div className="facts">
          <div>
            <span>Region: </span>
            {card.region || "—"}
          </div>
          <div>
            <span>Stage: </span>
            {card.stage || "Unranked"}
          </div>
          <div>
            <span>Status: </span>
            {card.status || "Challengeable"}
          </div>
          <div>
            wins: {card.wins ?? 0} losses: {card.losses ?? 0}
          </div>
        </div>
      </div>
      <div className="avatar-box">
        {src ? <img src={src} alt="" /> : null}
        {isGif ? null : null}
      </div>
    </article>
  );
}
