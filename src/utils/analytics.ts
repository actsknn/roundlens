import type { Match } from "../types/match";

type NumericKey = {
  [K in keyof Match]: Match[K] extends number ? K : never;
}[keyof Match];
export const sum = (matches: Match[], key: NumericKey) =>
  matches.reduce((total, m) => total + m[key], 0);
export const average = (matches: Match[], key: NumericKey) =>
  matches.length ? sum(matches, key) / matches.length : 0;
export const winRate = (matches: Match[]) =>
  matches.length
    ? (matches.filter((m) => m.result === "Win").length / matches.length) * 100
    : 0;
export const kd = (matches: Match[]) =>
  sum(matches, "deaths")
    ? (sum(matches, "kills") / sum(matches, "deaths")).toFixed(2)
    : sum(matches, "kills")
      ? "\u221e"
      : "0.00";
export const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(0)}`;
export function variance(matches: Match[]) {
  if (!matches.length) return 0;
  const mean = average(matches, "acs");
  return (
    matches.reduce((total, match) => total + (match.acs - mean) ** 2, 0) /
    matches.length
  );
}
export function firstDuelWinRate(matches: Match[]) {
  const kills = sum(matches, "firstKills"),
    deaths = sum(matches, "firstDeaths");
  return kills + deaths ? (kills / (kills + deaths)) * 100 : null;
}
export function recentTrend(matches: Match[]) {
  if (matches.length < 10) return null;
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  const current = average(sorted.slice(-5), "acs"),
    previous = average(sorted.slice(-10, -5), "acs");
  return {
    current,
    previous,
    difference: current - previous,
    percent: previous ? ((current - previous) / previous) * 100 : null,
  };
}
export function summarize(matches: Match[]) {
  const acs = average(matches, "acs"),
    acsVariance = variance(matches);
  const sd = Math.sqrt(acsVariance),
    wins = matches.filter((m) => m.result === "Win").length;
  return {
    kills: sum(matches, "kills"),
    deaths: sum(matches, "deaths"),
    firstKills: sum(matches, "firstKills"),
    firstDeaths: sum(matches, "firstDeaths"),
    headshotPercentage: average(matches, "headshotPercentage"),
    openingDifferential:
      sum(matches, "firstKills") - sum(matches, "firstDeaths"),
    matches: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: winRate(matches),
    acs,
    kd: kd(matches),
    firstDuelWinRate: firstDuelWinRate(matches),
    variance: acsVariance,
    sd,
    high: matches.reduce((high, m) => Math.max(high, m.acs), 0),
    low: matches.length
      ? matches.reduce((low, m) => Math.min(low, m.acs), Infinity)
      : 0,
    consistency: Math.round(
      Math.max(0, Math.min(100, 100 - (acs ? sd / acs : 0) * 150)),
    ),
  };
}
export type PerformanceGroup = ReturnType<typeof summarize> & { name: string };
export type Insight = { title: string; text: string };
export function analyze(matches: Match[]) {
  const summary = summarize(matches);
  const groups = (key: "map" | "agent"): PerformanceGroup[] =>
    [...new Set(matches.map((m) => m[key]))].map((name) => ({
      name,
      ...summarize(matches.filter((m) => m[key] === name)),
    }));
  const maps = groups("map").sort(
    (a, b) => b.winRate - a.winRate || b.acs - a.acs,
  );
  const agents = groups("agent").sort((a, b) => b.acs - a.acs);
  const eligibleMaps = maps.filter((m) => m.matches >= 3);
  // A comparative claim needs at least two maps, each with at least three games.
  const bestMap = eligibleMaps.length >= 2 ? eligibleMaps[0] : null;
  const weakestMap =
    eligibleMaps.length >= 2 ? eligibleMaps[eligibleMaps.length - 1] : null;
  const mapVariation = maps
    .filter((m) => m.matches >= 2)
    .sort((a, b) => b.sd - a.sd);
  const positive = matches.filter((m) => m.firstKills > m.firstDeaths);
  const negative = matches.filter((m) => m.firstKills <= m.firstDeaths);
  const gap = winRate(positive) - winRate(negative);
  const trend = recentTrend(matches);
  // Highlight only an agent that leads all three visible metrics; otherwise no overall winner.
  const eligibleAgents = agents.filter((a) => a.matches >= 3);
  const numericKD = (value: string) =>
    value === "\u221e" ? Infinity : Number(value);
  const strongestAgent =
    eligibleAgents.length >= 2
      ? (eligibleAgents.find((agent) =>
          eligibleAgents.every(
            (other) =>
              agent.winRate >= other.winRate &&
              agent.acs >= other.acs &&
              numericKD(agent.kd) >= numericKD(other.kd),
          ),
        ) ?? null)
      : null;
  const insights: Insight[] = [];
  if (positive.length && negative.length)
    insights.push({
      title: "Opening duels",
      text: `Your win rate is ${Math.abs(gap).toFixed(0)} percentage points ${gap >= 0 ? "higher" : "lower"} with positive opening differential (${positive.length} matches vs. ${negative.length}). This is an association, not proof of causation.`,
    });
  if (weakestMap && bestMap)
    insights.push({
      title: "Map range",
      text: `${bestMap.name} leads at ${bestMap.winRate.toFixed(0)}% wins (${bestMap.matches} games); ${weakestMap.name} is lowest at ${weakestMap.winRate.toFixed(0)}% (${weakestMap.matches} games). Only maps with 3+ matches are compared; ACS breaks win-rate ties.`,
    });
  if (agents.length > 1)
    insights.push({
      title: "Agent output",
      text: `${agents[0].name} produces your highest average ACS: ${agents[0].acs.toFixed(0)} over ${agents[0].matches} matches. Map selection and sample size affect this comparison.`,
    });
  if (matches.length > 1)
    insights.push({
      title: "Consistency",
      text: `ACS ranges from ${summary.low} to ${summary.high}, with a standard deviation of ${summary.sd.toFixed(1)} around a ${summary.acs.toFixed(0)} average. ${summary.consistency >= 75 ? "Output is relatively steady in this sample." : "Review low-output matches for recurring patterns."}`,
    });
  if (trend)
    insights.push({
      title: "Recent trend",
      text:
        trend.percent === null
          ? `Your last five matches averaged ${trend.current.toFixed(0)} ACS versus zero in the previous five; a percentage comparison is unavailable.`
          : `Your last five matches averaged ${trend.current.toFixed(0)} ACS, ${Math.abs(trend.percent).toFixed(1)}% ${trend.percent >= 0 ? "higher" : "lower"} than the previous five (${trend.previous.toFixed(0)}).`,
    });
  return {
    ...summary,
    maps,
    agents,
    positive,
    negative,
    gap,
    insights,
    trend,
    bestMap,
    weakestMap,
    mapVariation,
    strongestAgent,
  };
}
export type Analytics = ReturnType<typeof analyze>;
