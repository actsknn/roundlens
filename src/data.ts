// Compatibility exports. Data sources normalize to the shared Match type.
export type { Match } from "./types/match.ts";
export { demoMatches } from "./data/demoMatches.ts";
export * from "./utils/analytics.ts";
export { columns, parseCSV, downloadExample } from "./utils/csv.ts";
