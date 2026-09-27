export interface Match {
  date: string;
  map: string;
  agent: string;
  result: "Win" | "Loss";
  roundsWon: number;
  roundsLost: number;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  firstKills: number;
  firstDeaths: number;
  headshotPercentage: number;
}
