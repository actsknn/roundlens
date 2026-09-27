import type { Analytics } from "../utils/analytics";
import { PanelHeader } from "./primitives";
export default function PerformanceSplits({ a }: { a: Analytics }) {
  const maps = a.maps,
    agents = a.agents;

  return (
    <div className="breakdown-grid">
      <section className="panel">
        <PanelHeader
          number="03"
          title="Map splits"
          detail="RANKED BY WIN RATE"
        />
        <div className="table-scroll">
          <table className="split-table">
            <thead>
              <tr>
                <th>Map</th>
                <th>W / L</th>
                <th>K/D</th>
                <th className="rate-heading">Win rate</th>
                <th>Avg ACS</th>
              </tr>
            </thead>
            <tbody>
              {maps.map((m) => (
                <tr key={m.name}>
                  <td className="name-cell">{m.name}</td>
                  <td title={`${m.matches} played`}>
                    {m.wins} / {m.losses}
                  </td>
                  <td>{m.kd}</td>
                  <td>
                    <div className="rate-cell">
                      <div className="rate-track">
                        <i style={{ width: `${m.winRate}%` }} />
                      </div>
                      <span>{m.winRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>{m.acs.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <PanelHeader number="04" title="Agent splits" detail="RANKED BY ACS" />
        <div className="table-scroll">
          <table className="split-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Played</th>
                <th>Win rate</th>
                <th>K/D</th>
                <th>Avg ACS</th>
                <th>Duel WR</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => (
                <tr key={agent.name}>
                  <td className="name-cell">
                    {agent.name}
                    {i === 0 && <span className="top-label">TOP ACS</span>}
                  </td>
                  <td>{agent.matches}</td>
                  <td>{agent.winRate.toFixed(0)}%</td>
                  <td>{agent.kd}</td>
                  <td className={i === 0 ? "accent" : ""}>
                    {agent.acs.toFixed(0)}
                  </td>
                  <td>
                    {agent.firstDuelWinRate === null
                      ? "—"
                      : `${agent.firstDuelWinRate.toFixed(0)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="agent-note">
          {a.strongestAgent && (
            <p>
              <strong>{a.strongestAgent.name}</strong> leads win rate, ACS and
              K/D among agents with 3+ matches.
            </p>
          )}
          <span className="label">AGENT NOTE</span>
          <p>
            <strong>{agents[0]?.name ?? "—"}</strong> leads with{" "}
            {agents[0]?.acs.toFixed(0) ?? "—"} average ACS across{" "}
            {agents[0]?.matches ?? 0} matches.
            {agents.length > 1 && (
              <>
                {" "}
                {Math.round(agents[0].acs - agents[1].acs)} above{" "}
                {agents[1].name}.
              </>
            )}
          </p>
          <small>Different maps and sample sizes affect this comparison.</small>
        </div>
      </section>
    </div>
  );
}
