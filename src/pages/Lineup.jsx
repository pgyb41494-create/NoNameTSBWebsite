import { useEffect, useState } from "react";
import { api, brand } from "../api";
import { DEMO } from "../data/demo";
import { PlayerCard } from "../components/PlayerCard";

export default function Lineup() {
  const [data, setData] = useState(DEMO);
  const [region, setRegion] = useState("na");

  useEffect(() => {
    api.public().then((live) => {
      if (live && live.lineup?.regions?.length) {
        setData(live);
        setRegion(live.lineup.regions[0].key);
      }
    });
  }, []);

  const regions = data.lineup?.regions || [];
  const current = regions.find((r) => r.key === region) || regions[0];
  const gif = data.lineup?.gif || data.brand?.gif || brand.gif;

  return (
    <section className="wrap page">
      <h1>Lineup</h1>
      <p className="sub">Regional main boards. Same card layout as Discord.</p>
      <div className="tabs">
        {regions.map((r) => (
          <button key={r.key} className={`tab ${r.key === current?.key ? "on" : ""}`} onClick={() => setRegion(r.key)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="stack">
        {(current?.main || []).map((card) => (
          <PlayerCard key={`${current.key}-${card.position}`} card={card} gif={gif} />
        ))}
      </div>
    </section>
  );
}
