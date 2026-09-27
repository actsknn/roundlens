import { type Analytics, signed, winRate } from "../utils/analytics";
import { PanelHeader, Comparison } from "./primitives";
export default function RoundImpact({ a }: { a: Analytics }) {
  const fk = a.firstKills,
    fd = a.firstDeaths;
  const hasComparison = !!a.positive.length && !!a.negative.length;
  const acsVariance = a.variance;

  return (
    <section className="panel impact-panel">
      <PanelHeader number="01" title="Round Impact" detail="ALL MATCHES" />
      <div className="opening-total">
        <div>
          <span className="label">OPENING DUEL DIFFERENTIAL</span>
          <strong className={fk - fd > 0 ? "accent" : ""}>
            {signed(fk - fd)}
          </strong>
        </div>
        <div className="opening-counts">
          <span>
            FIRST KILLS <b>{fk}</b>
          </span>
          <span>
            FIRST DEATHS <b>{fd}</b>
          </span>
        </div>
      </div>
      <div className="duel-split">
        <Comparison
          label="Positive differential"
          count={a.positive.length}
          rate={winRate(a.positive)}
          accent
        />
        <Comparison
          label="Zero / negative differential"
          count={a.negative.length}
          rate={winRate(a.negative)}
        />
      </div>
      <div className="impact-callout">
        {hasComparison ? (
          <>
            <strong>{signed(a.gap)} pp</strong> match win rate when FK &gt; FD
          </>
        ) : (
          "Not enough match groups to compare."
        )}
      </div>
      <dl className="impact-facts">
        <div>
          <dt>
            ACS variance <span>σ²</span>
          </dt>
          <dd>
            {acsVariance.toFixed(0)} <small>points²</small>
          </dd>
        </div>
        <div>
          <dt>
            Best map <small>3+ games / win rate</small>
          </dt>
          <dd>
            {a.bestMap ? (
              <>
                {a.bestMap.name} <b>{a.bestMap.winRate.toFixed(0)}%</b>
              </>
            ) : (
              "Insufficient sample"
            )}
          </dd>
        </div>
        <div>
          <dt>
            Weakest map <small>3+ games / win rate</small>
          </dt>
          <dd>
            {a.weakestMap ? (
              <>
                {a.weakestMap.name} <b>{a.weakestMap.winRate.toFixed(0)}%</b>
              </>
            ) : (
              "Insufficient sample"
            )}
          </dd>
        </div>
      </dl>
      <p className="method-note">
        Opening differential = first kills − first deaths. Match-level
        association; not round-win probability.
      </p>
    </section>
  );
}
