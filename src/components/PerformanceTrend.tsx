import type { Match } from "../types/match";
import { type Analytics, average, summarize } from "../utils/analytics";
import { PanelHeader } from "./primitives";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const tooltipStyle = {
  background: "#17191c",
  border: "1px solid #41454b",
  borderRadius: 0,
  color: "#e3e5e8",
  fontSize: 11,
};
export default function PerformanceTrend({
  matches,
  a,
}: {
  matches: Match[];
  a: Analytics;
}) {
  const [windowSize, setWindowSize] = useState(12);
  const trendMatches = windowSize ? matches.slice(-windowSize) : matches;
  const summary = summarize(trendMatches);
  const trend = trendMatches.map((m, i) => ({ ...m, index: i + 1 }));

  return (
    <section className="panel trend-panel">
      <PanelHeader
        number="02"
        title="ACS / match trend"
        detail={
          <div className="segmented">
            {[12, 20, 0].map((n) => (
              <button
                key={n}
                aria-pressed={windowSize === n}
                className={windowSize === n ? "selected" : ""}
                onClick={() => setWindowSize(n)}
              >
                {n || "ALL"}
              </button>
            ))}
          </div>
        }
      />
      <div className="chart-meta">
        <span>
          <i className="line-key" /> ACS{" "}
          <b>{average(trendMatches, "acs").toFixed(0)}</b> avg.
        </span>
        <span>
          <i className="dash-key" /> Dataset mean {a.acs.toFixed(0)}
        </span>
        <span>{trend.length} matches / oldest → newest</span>
      </div>
      <div className="trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trend}
            margin={{ top: 15, right: 20, left: -12, bottom: 5 }}
          >
            <CartesianGrid
              stroke="#282c32"
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              axisLine={{ stroke: "#30343a" }}
              tickLine={false}
              minTickGap={20}
              tick={{ fill: "#8e949e", fontSize: 10, fontFamily: "monospace" }}
              tickFormatter={(v) => String(v).padStart(2, "0")}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8e949e", fontSize: 10, fontFamily: "monospace" }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) =>
                payload?.[0]
                  ? `${payload[0].payload.date} / ${payload[0].payload.map} / ${payload[0].payload.result}`
                  : ""
              }
            />
            <ReferenceLine y={a.acs} stroke="#737a85" strokeDasharray="5 5" />
            <Line
              type="linear"
              dataKey="acs"
              name="ACS"
              stroke="#bf9d73"
              strokeWidth={2}
              dot={{ r: 3, fill: "#111317", strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        className="result-sequence"
        aria-label="Results from oldest to newest"
      >
        {trendMatches.slice(-40).map((m, i) => (
          <span
            key={i}
            title={`${m.date} · ${m.map} · ${m.roundsWon}:${m.roundsLost}`}
            className={m.result === "Win" ? "win" : "loss"}
          >
            {m.result === "Win" ? "W" : "L"}
          </span>
        ))}
        <small>
          {trendMatches.length > 40 ? "LAST 40 RESULTS" : "MATCH RESULTS"}
        </small>
      </div>
      <div className="trend-annotation">
        {a.trend ? (
          a.trend.percent === null ? (
            <>
              Last five: {a.trend.current.toFixed(0)} ACS; previous five: 0.
              Percentage change unavailable.
            </>
          ) : (
            <>
              Recent ACS is{" "}
              <strong
                className={a.trend.percent >= 0 ? "positive" : "negative"}
              >
                {a.trend.percent >= 0 ? "up" : "down"}{" "}
                {Math.abs(a.trend.percent).toFixed(1)}%
              </strong>{" "}
              over the previous five matches.
            </>
          )
        ) : (
          "Ten matches are needed for a five-vs-five trend comparison."
        )}
      </div>
      <div className="trend-foot">
        <span>
          LOW <b>{summary.low}</b>
        </span>
        <span>
          HIGH <b>{summary.high}</b>
        </span>
        <span>
          SD <b>±{summary.sd.toFixed(1)}</b>
        </span>
        <details>
          <summary>Consistency calculation</summary>
          <p>
            Score = max(0, 100 − 150 × ACS standard deviation / average ACS).
            Less variation scores higher. All-zero ACS has zero variation; fewer
            than two matches shows no score.
          </p>
        </details>
      </div>
    </section>
  );
}
