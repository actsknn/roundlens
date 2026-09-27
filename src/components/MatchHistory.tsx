import type { Match } from "../types/match";
import { signed } from "../utils/analytics";
import { PanelHeader } from "./primitives";
import { useState } from "react";
export default function MatchHistory({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState("All"),
    [page, setPage] = useState(0);
  const recent = [...matches]
    .reverse()
    .filter((m) => filter === "All" || m.result === filter);
  const pages = Math.ceil(recent.length / 10),
    displayed = recent.slice(page * 10, page * 10 + 10);
  const maxACS = Math.max(...matches.map((m) => m.acs), 1);

  return (
    <section className="panel history-panel">
      <PanelHeader
        number="05"
        title="Match history"
        detail={
          <div className="segmented">
            {["All", "Win", "Loss"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                className={filter === f ? "selected" : ""}
                onClick={() => {
                  setFilter(f);
                  setPage(0);
                }}
              >
                {f === "All" ? "ALL" : f === "Win" ? "WINS" : "LOSSES"}
              </button>
            ))}
          </div>
        }
      />
      <div className="table-scroll">
        <table className="match-table">
          <thead>
            <tr>
              {[
                "W/L",
                "Date",
                "Map",
                "Agent",
                "Score",
                "K / D / A",
                "ACS",
                "FK / FD",
                "HS %",
                "Opening Δ",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((m, i) => (
              <tr
                key={`${m.date}-${i}`}
                className={m.result === "Win" ? "match-win" : "match-loss"}
              >
                <td data-label="Result">
                  <span
                    className={`result ${m.result === "Win" ? "win" : "loss"}`}
                    aria-label={m.result}
                  >
                    {m.result === "Win" ? "W" : "L"}
                  </span>
                </td>
                <td data-label="Date" className="date-cell">
                  {m.date}
                </td>
                <td data-label="Map" className="name-cell">
                  {m.map}
                </td>
                <td data-label="Agent" className="agent-name">
                  {m.agent}
                </td>
                <td data-label="Score">
                  <b>{m.roundsWon}</b>
                  <span className="divider">:</span>
                  {m.roundsLost}
                </td>
                <td data-label="K / D / A">
                  <b>{m.kills}</b>
                  <span className="divider">/</span>
                  {m.deaths}
                  <span className="divider">/</span>
                  {m.assists}
                </td>
                <td data-label="ACS" className="acs-cell">
                  {m.acs}
                  <span className="mini-acs">
                    <i style={{ width: `${(m.acs / maxACS) * 100}%` }} />
                  </span>
                </td>
                <td data-label="FK / FD">
                  {m.firstKills}
                  <span className="divider">/</span>
                  {m.firstDeaths}
                </td>
                <td data-label="HS %">{m.headshotPercentage}%</td>
                <td
                  data-label="Opening delta"
                  className={m.firstKills > m.firstDeaths ? "accent" : "muted"}
                >
                  {signed(m.firstKills - m.firstDeaths)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!recent.length && <p className="empty">No matches in this filter.</p>}
      </div>
      <div className="table-footer">
        <span>
          {recent.length
            ? `${page * 10 + 1}–${Math.min((page + 1) * 10, recent.length)}`
            : "0"}{" "}
          / {recent.length} matches
        </span>
        <span className="history-key">
          FK / FD = first kills / first deaths
        </span>
        <div>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <button
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
