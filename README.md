# RoundLens

Local VALORANT match analytics for fictional player Ajay. React, TypeScript, Vite, Recharts, Tailwind/CSS and Lucide. No backend, authentication, API keys, external requests, or Riot integration.

## Run and verify

```sh
npm install
npm run dev
npm run build
npm run preview
npm test
```

Use `npm.cmd` in Windows PowerShell if script execution is restricted. The tests use Node's TypeScript support and require Node 22.18+ (verified on Node 24). The production output is `dist/`; deploy that directory to any static host with build command `npm run build`. No environment variables are required.

Demo data loads immediately. CSV upload replaces the active dataset; Load Demo Data restores it. Data stays in browser memory and resets on refresh. Rank belongs to the fictional player profile and is not inferred from imports.

## Code structure

- `src/types/match.ts`: shared internal Match contract. Results remain `Win` / `Loss` for compatibility; CSV also accepts W/L.
- `src/data/demoMatches.ts`: 20 fictional matches.
- `src/utils/analytics.ts`: aggregate metrics, groups, sample thresholds, trend, and deterministic insights.
- `src/utils/csv.ts`: client-side CSV validation and example download.
- `src/components/`: Round Impact, trend, map/agent breakdowns, match history, and shared panel primitives.
- `src/App.tsx`: dataset state, import controls, and page composition.
- `src/data.ts`: compatibility exports.
- `tests/analytics.test.ts`: formula, edge-case, and CSV tests.
- `tests/browser-check.mjs`: browser smoke checks; accepts the installed Playwright module path and screenshot directory as arguments. Playwright is intentionally not an app dependency. Requires installed Microsoft Edge and a running dev server.

## CSV

Required headers, in order:

```csv
date,map,agent,result,roundsWon,roundsLost,kills,deaths,assists,acs,firstKills,firstDeaths,headshotPercentage
```

Dates: YYYY-MM-DD. Results: Win/Loss or W/L, case insensitive. Counts: nonnegative integers. Headshot percentage: 0–100. Download example CSV provides valid demo rows. The parser supports quoted fields, escaped quotes, BOM, and Windows/Unix newlines. Invalid rows reject the whole import and preserve the current dataset. Limits: 5 MB / 10,000 matches.

## Metrics and interpretation

- Win rate: wins / matches; K/D: total kills / total deaths. Zero deaths with kills shows infinity.
- ACS: arithmetic mean. Headshot percentage is a mean of per-match percentages, not a shot-weighted percentage (shot counts are unavailable).
- First duel win rate: first kills / (first kills + first deaths). No recorded opening duels shows no rate.
- Opening differential: total first kills − first deaths. Conditional win rates compare positive differential matches with neutral/negative matches. Differences use percentage points, not relative percentages.
- Consistency: max(0, 100 − 150 × population ACS standard deviation / mean ACS), rounded. One match displays no score. All-zero ACS has zero variation. Higher scores indicate less fluctuation, not necessarily stronger performance.
- Recent trend: latest five matches vs. previous five, requiring ten matches. A zero baseline has no percentage change.
- Best/weakest maps: compare at least two maps with at least three games each; ties in win rate use ACS. All maps remain visible in the table.
- Most inconsistent map: greatest ACS standard deviation, comparing at least two maps with two games each.
- Strongest agent: highlighted only if it leads win rate, ACS and K/D among at least two agents with three games each. No hidden score; highest ACS is labeled separately.
- Insights are deterministic associations, not proof of causality or round-level analysis. Small samples may change quickly.

## Future Riot integration

Keep API retrieval outside presentation components. A future adapter should normalize validated match responses to `Match[]`, then use the existing analytics unchanged. Before implementation, verify Riot's current production access and authentication requirements, establish authorized player access, and design a server-side boundary for credentials and rate limits. No working API adapter or Riot connection is claimed in this prototype.
