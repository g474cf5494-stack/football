export type ReliabilityRank = "S" | "A" | "B" | "C" | "D";

export type TransferStatus =
  | "rumour"
  | "talks"
  | "advanced"
  | "agreement"
  | "done";

export type DevelopmentCategory =
  | "自クラブ育成"
  | "Jクラブ育成"
  | "協会育成"
  | "自由枠"
  | "判定不能";

export type PlayerStatsRadar = {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

export type MarketValuePoint = {
  date: string;
  value: number;
};

export type TransferRumour = {
  id: string;
  playerName: string;
  age: number;
  position: string;
  fromClub: string;
  toClub: string;
  feeMillion: number;
  annualWageMillion: number;
  contractYears: number;
  status: TransferStatus;
  sourceName: string;
  sourceUrl?: string;
  sourceTier: number;
  crossSourceCount: number;
  updatedAt: string;
  photoUrl?: string;
};

export type PlayerProfile = {
  id: string;
  name: string;
  club: string;
  position: string;
  age: number;
  marketValueMillion: number;
  wageMillion: number;
  contractUntil: string;
  photoUrl?: string;
  stats: PlayerStatsRadar;
  marketValueTrend: MarketValuePoint[];
  developmentCategory: DevelopmentCategory;
  developmentReason: string;
};

export type Fixture = {
  id: string;
  date: string;
  competition: string;
  home: string;
  away: string;
};

export type WageCost = {
  annualWageCostMillion: number;
  wageToRevenueRatio?: number;
  sourceName: string;
  updatedAt: string;
};

export type ClubDashboard = {
  clubName: string;
  league: string;
  logoUrl?: string;
  lastUpdated: string;
  wageCost: WageCost;
  transferRumours: TransferRumour[];
  players: PlayerProfile[];
  fixtures: Fixture[];
};
