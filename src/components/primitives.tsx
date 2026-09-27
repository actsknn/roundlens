import type { ReactNode } from "react";
export function Stat({
  label,
  value,
  note,
  suffix = "",
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <strong className={accent ? "accent" : ""}>
        {value}
        <small>{suffix}</small>
      </strong>
      <span className="stat-note">{note}</span>
    </div>
  );
}
export function PanelHeader({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: ReactNode;
}) {
  return (
    <div className="panel-header">
      <h2>
        <span>{number}</span>
        {title}
      </h2>
      <div className="panel-detail">{detail}</div>
    </div>
  );
}
export function Comparison({
  label,
  count,
  rate,
  accent = false,
}: {
  label: string;
  count: number;
  rate: number;
  accent?: boolean;
}) {
  return (
    <div className="comparison">
      <div>
        <span>
          {label} <small>n={count}</small>
        </span>
        <b>{count ? `${rate.toFixed(0)}%` : "—"}</b>
      </div>
      <div className="comparison-track">
        <i
          className={accent ? "highlight" : ""}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
