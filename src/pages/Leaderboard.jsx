import { useEffect, useState } from "react";
import { api, brand } from "../api";
import { DEMO } from "../data/demo";
import { PlayerCard } from "../components/PlayerCard";

export default function Leaderboard() {
  const [data, setData] = useState(DEMO);

  useEffect(() => {
    api.public().then((live) => {
      if (live && live.leaderboard?.cards?.length) setData(live);
    });
  }, []);

  const cards = data.leaderboard?.cards || [];
  const gif = data.leaderboard?.gif || data.brand?.gif || brand.gif;

  return (
    <section className="wrap page">
      <h1>Leaderboard</h1>
      <p className="sub">Prize board / ranked ladder. Admins place players with 'tsbtop or the setup draft channel.</p>
      <div className="stack">
        {cards.map((card) => (
          <PlayerCard key={`${card.position}-${card.discordId || card.name}`} card={card} gif={gif} />
        ))}
      </div>
    </section>
  );
}
