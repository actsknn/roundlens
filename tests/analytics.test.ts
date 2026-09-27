import assert from "node:assert/strict";
import test from "node:test";
import { demoMatches } from "../src/data/demoMatches.ts";
import {
  analyze,
  summarize,
  recentTrend,
  firstDuelWinRate,
  kd,
  variance,
} from "../src/utils/analytics.ts";
import { columns, parseCSV } from "../src/utils/csv.ts";
const csv = (matches = demoMatches) =>
  [
    columns.join(","),
    ...matches.map((m) => columns.map((c) => m[c]).join(",")),
  ].join("\r\n");

test("aggregate metrics use totals and population variance", () => {
  const data = [
    {
      ...demoMatches[0],
      result: "Win" as const,
      kills: 30,
      deaths: 10,
      acs: 300,
      firstKills: 6,
      firstDeaths: 2,
    },
    {
      ...demoMatches[1],
      result: "Loss" as const,
      kills: 10,
      deaths: 20,
      acs: 100,
      firstKills: 2,
      firstDeaths: 6,
    },
  ];
  const a = analyze(data);
  assert.equal(a.winRate, 50);
  assert.equal(a.kd, "1.33");
  assert.equal(a.acs, 200);
  assert.equal(a.firstDuelWinRate, 50);
  assert.equal(a.variance, 10000);
  assert.equal(a.sd, 100);
  assert.equal(a.consistency, 25);
  assert.equal(a.gap, 100);
  assert.equal(a.bestMap, null);
  assert.equal(a.weakestMap, null);
});
test("empty and zero-denominator inputs are safe", () => {
  assert.equal(analyze([]).insights.length, 0);
  assert.equal(variance([]), 0);
  assert.equal(firstDuelWinRate([]), null);
  assert.equal(kd([]), "0.00");
  assert.equal(kd([{ ...demoMatches[0], deaths: 0 }]), "\u221e");
  const zero = [{ ...demoMatches[0], acs: 0 }];
  assert.equal(summarize(zero).consistency, 100);
  assert.equal(recentTrend(zero), null);
});
test("demo has correct group counts, metrics, and bounded insights", () => {
  const a = analyze(demoMatches);
  assert.equal(a.matches, 20);
  assert.equal(a.winRate, 60);
  assert.equal(a.maps.length, 5);
  assert.equal(a.agents.length, 3);
  assert.equal(a.strongestAgent?.name, "Neon");
  assert.ok(a.insights.length <= 5);
  assert.equal(
    a.maps.reduce((sum, m) => sum + m.wins + m.losses, 0),
    20,
  );
  assert.equal(
    a.agents.reduce((sum, m) => sum + m.matches, 0),
    20,
  );
});
test("recent five versus previous five uses chronological data", () => {
  const data = Array.from({ length: 10 }, (_, i) => ({
    ...demoMatches[0],
    date: `2026-09-${String(i + 1).padStart(2, "0")}`,
    acs: i < 5 ? 100 : 150,
  }));
  assert.equal(recentTrend([...data].reverse())?.percent, 50);
  assert.equal(
    recentTrend(data.map((m, i) => ({ ...m, acs: i < 5 ? 0 : 100 })))?.percent,
    null,
  );
});
test("CSV roundtrip, BOM, quoted fields, and short result labels", () => {
  assert.deepEqual(parseCSV(csv()), demoMatches);
  assert.deepEqual(parseCSV("\uFEFF" + csv()), demoMatches);
  const short = csv([demoMatches[0]]).replace(",Loss,", ",L,");
  assert.equal(parseCSV(short)[0].result, "Loss");
  const quoted = csv([demoMatches[0]]).replace(",Ascent,", ',"Test, ""Map""",');
  assert.equal(parseCSV(quoted)[0].map, 'Test, "Map"');
});
test("CSV rejects malformed quotes, impossible dates, invalid numbers, and conflicting scores", () => {
  assert.throws(() => parseCSV("bad"));
  assert.throws(() => parseCSV(columns.join(",")));
  assert.throws(() => parseCSV(csv().replace("2026-09-06", "2026-02-30")));
  assert.throws(() => parseCSV(csv().replace(",Ascent,", ',"Ascent"oops,')));
  assert.throws(() => parseCSV(csv().replace(",Ascent,", ',"Ascent,')));
  assert.throws(() => parseCSV(csv([{ ...demoMatches[0], kills: -1 }])));
  assert.throws(() => parseCSV(csv([{ ...demoMatches[0], result: "Win" }])));
  assert.throws(() =>
    parseCSV(csv([{ ...demoMatches[0], headshotPercentage: 101 }])),
  );
});
