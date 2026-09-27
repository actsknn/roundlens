import { useMemo, useRef, useState } from "react";
import { Crosshair, Download, RotateCcw, Upload, X } from "lucide-react";
import RoundImpact from "./components/RoundImpact";
import PerformanceTrend from "./components/PerformanceTrend";
import PerformanceSplits from "./components/PerformanceSplits";
import MatchHistory from "./components/MatchHistory";
import { Stat } from "./components/primitives";
import {
  analyze,
  demoMatches,
  downloadExample,
  parseCSV,
  type Match,
  signed,
} from "./data";

export default function App() {
  const [matches, setMatches] = useState<Match[]>(demoMatches);
  const [source, setSource] = useState("demo");
  const [error, setError] = useState("");
  const [datasetVersion, setDatasetVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const a = useMemo(() => analyze(matches), [matches]);
  const fk = a.firstKills,
    fd = a.firstDeaths;
  const sd = a.sd;
  const agents = a.agents;
  const mapVariation = a.mapVariation;
  const hasComparison = a.positive.length > 0 && a.negative.length > 0;
  const duelNote = hasComparison
    ? `${signed(a.gap)} pp win rate with positive opening differential`
    : "Opening comparison needs both match groups";

  function loadDemo() {
    setDatasetVersion((v) => v + 1);
    setMatches(demoMatches);
    setSource("demo");
    setError("");
    setNotice("Loaded 20 demo matches.");
  }
  async function upload(f?: File) {
    if (!f) return;
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (f.size > 5 * 1024 * 1024)
        throw new Error("Please select a CSV smaller than 5 MB.");
      const data = parseCSV(await f.text());
      setDatasetVersion((v) => v + 1);
      setMatches(data);
      setSource(f.name);
      setNotice(`Imported ${data.length} matches.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this CSV.");
    } finally {
      setLoading(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="telemetry">
      <header className="app-bar">
        <a href="#" className="wordmark">
          <Crosshair size={18} strokeWidth={1.5} /> ROUNDLENS{" "}
          <span> / 0.1</span>
        </a>
        <span className="app-context">VALORANT / MATCH ANALYSIS</span>
        <div className="controls">
          <button disabled={loading} onClick={loadDemo}>
            <RotateCcw size={12} /> Load Demo Data
          </button>
          <button
            disabled={loading}
            className="import-button"
            onClick={() => file.current?.click()}
          >
            <Upload size={12} /> {loading ? "Importing…" : "Upload CSV"}
          </button>
          <input
            ref={file}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Upload match CSV"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>
      </header>
      <main>
        <section className="player-strip" aria-label="Player profile">
          <div className="identity">
            <h1>Ajay</h1>
            <span className="rank-mark">I</span>
            <strong>Immortal 1</strong>
            {source !== "demo" && <small>demo profile rank</small>}
          </div>
          <div className="sample-meta">
            <span>
              <b>{matches.length}</b> matches analyzed
            </span>
            <span className="mono">
              {matches[0]?.date ?? "—"} —{" "}
              {matches[matches.length - 1]?.date ?? "—"}
            </span>
            <span className="queue">COMPETITIVE</span>
          </div>
        </section>
        <div className="dataset-strip">
          <span>
            {source === "demo"
              ? "Demo dataset — RoundLens v0.1"
              : `CSV / ${source}`}
          </span>
          <button onClick={downloadExample}>
            <Download size={11} /> Download example CSV
          </button>
        </div>
        {error && (
          <div role="alert" className="message error">
            <span>
              <strong>Import failed.</strong> {error}
            </span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={14} />
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="message">
            <span>{notice}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <section className="stat-strip" aria-label="Core statistics">
          <Stat
            label="WIN RATE"
            value={`${a.winRate.toFixed(0)}%`}
            note={`${a.wins}W / ${a.losses}L`}
          />
          <Stat
            label="K/D"
            value={a.kd}
            note={`${a.kills} kills / ${a.deaths} deaths`}
          />
          <Stat
            label="AVG ACS"
            value={a.acs.toFixed(0)}
            note={`${a.headshotPercentage.toFixed(1)}% avg. match HS`}
          />
          <Stat
            label="FIRST DUEL WIN RATE"
            value={
              a.firstDuelWinRate !== null
                ? `${a.firstDuelWinRate.toFixed(1)}%`
                : "—"
            }
            note={`${fk} FK / ${fd} FD`}
            accent={fk > fd}
          />
          <Stat
            label="CONSISTENCY"
            value={matches.length > 1 ? `${a.consistency}` : "—"}
            suffix={matches.length > 1 ? "/100" : ""}
            note={
              matches.length > 1
                ? `ACS deviation ±${sd.toFixed(1)}`
                : "Requires 2+ matches"
            }
          />
        </section>
        <div className="signal-strip">
          <span className="signal-label">OBSERVED</span>
          <span>{duelNote}</span>
          <span>
            Highest ACS on <b>{agents[0]?.name ?? "—"}</b>
          </span>
          <span>
            {mapVariation.length >= 2 ? (
              <>
                Most inconsistent on <b>{mapVariation[0].name}</b>{" "}
                <small>(ACS SD)</small>
              </>
            ) : (
              "Map variation needs 2 maps with 2+ matches"
            )}
          </span>
        </div>

        <div className="analysis-grid">
          <RoundImpact a={a} />
          <PerformanceTrend matches={matches} a={a} />
        </div>

        <PerformanceSplits a={a} />

        <MatchHistory key={datasetVersion} matches={matches} />
        <section className="review-notes">
          <h2>
            What RoundLens noticed <span>/ REVIEW NOTES</span>
          </h2>
          <div>
            {!a.insights.length && (
              <p>Add more matches to compare performance patterns.</p>
            )}
            {a.insights.map((insight, i) => (
              <p key={insight.title}>
                <span>0{i + 1}</span>
                {insight.text}
              </p>
            ))}
          </div>
        </section>
        <footer>
          <span>ROUNDLENS / 0.1</span>
          <p>
            Built as an early prototype to explore whether match data can reveal
            actionable patterns beyond traditional VALORANT statistics.
          </p>
          <small>
            Current prototype uses local match data. Live Riot API integration
            is planned after authentication and production API requirements are
            implemented. Not affiliated with Riot Games.
          </small>
        </footer>
      </main>
    </div>
  );
}
