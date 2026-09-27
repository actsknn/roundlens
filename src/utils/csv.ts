import type { Match } from "../types/match.ts";
import { demoMatches } from "../data/demoMatches.ts";
export const columns = [
  "date",
  "map",
  "agent",
  "result",
  "roundsWon",
  "roundsLost",
  "kills",
  "deaths",
  "assists",
  "acs",
  "firstKills",
  "firstDeaths",
  "headshotPercentage",
] as const;
export function parseCSV(text: string): Match[] {
  const records: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, "");
  const pushField = () => {
    row.push(field.trim());
    field = "";
    closed = false;
  };
  const pushRow = () => {
    pushField();
    if (row.some(Boolean)) records.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        closed = true;
      } else field += c;
    } else if (c === ",") pushField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else if (c === '"') {
      if (closed || field.trim()) throw new Error("Unexpected quote in CSV.");
      field = "";
      quoted = true;
    } else if (closed) {
      if (c.trim()) throw new Error("Unexpected text after a closing quote.");
    } else field += c;
  }
  if (quoted) throw new Error("A quoted field is missing its closing quote.");
  pushRow();
  const header = records.shift();
  if (!header || header.join(",") !== columns.join(","))
    throw new Error(
      "The CSV headers do not match. Download the example CSV for the required format.",
    );
  if (!records.length)
    throw new Error("Your CSV has no matches. Add at least one match.");
  if (records.length > 10000)
    throw new Error("Please upload 10,000 matches or fewer.");
  return records
    .map((r, i) => {
      const line = i + 2;
      if (r.length !== columns.length)
        throw new Error(`Row ${line}: expected 14 columns.`);
      const obj = Object.fromEntries(
        columns.map((c, j) => [c, j < 4 ? r[j] : Number(r[j])]),
      ) as unknown as Match;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(obj.date) ||
        !Number.isFinite(Date.parse(obj.date)) ||
        new Date(obj.date).toISOString().slice(0, 10) !== obj.date
      )
        throw new Error(`Row ${line}: use a valid date in YYYY-MM-DD format.`);
      if (
        !obj.map ||
        !obj.agent ||
        obj.map.length > 40 ||
        obj.agent.length > 40
      )
        throw new Error(
          `Row ${line}: provide a map and agent of up to 40 characters.`,
        );
      const result = obj.result.toLowerCase();
      if (!["win", "loss", "w", "l"].includes(result))
        throw new Error(`Row ${line}: result must be Win, Loss, W, or L.`);
      obj.result = result === "win" || result === "w" ? "Win" : "Loss";
      for (let j = 4; j < columns.length; j++) {
        const value = Number(r[j]);
        if (
          !r[j] ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 10000 ||
          (j !== 13 && !Number.isInteger(value))
        )
          throw new Error(
            `Row ${line}: ${columns[j]} must be a valid nonnegative ${j === 13 ? "number" : "integer"}.`,
          );
      }
      if (obj.headshotPercentage > 100)
        throw new Error(
          `Row ${line}: headshotPercentage must be between 0 and 100.`,
        );
      if (
        (obj.result === "Win" && obj.roundsWon <= obj.roundsLost) ||
        (obj.result === "Loss" && obj.roundsWon >= obj.roundsLost)
      )
        throw new Error(`Row ${line}: the score must agree with the result.`);
      if (
        obj.firstKills > obj.kills ||
        obj.firstDeaths > obj.deaths ||
        obj.firstKills + obj.firstDeaths > obj.roundsWon + obj.roundsLost
      )
        throw new Error(
          `Row ${line}: opening-duel counts are inconsistent with kills, deaths, or rounds.`,
        );
      return obj;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function downloadExample() {
  const csv = [
    columns.join(","),
    ...demoMatches.map((m) => columns.map((c) => m[c]).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "roundlens-example.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
