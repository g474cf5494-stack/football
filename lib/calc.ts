import type {
  DevelopmentCategory,
  PlayerStatsRadar,
  ReliabilityRank,
  TransferRumour,
} from "@/types/football";

export function calcReliabilityScore(item: TransferRumour) {
  const sourceScore = Math.min(item.sourceTier * 18, 54);
  const crossSourceScore = Math.min(item.crossSourceCount * 10, 30);

  const statusScoreMap = {
    rumour: 5,
    talks: 12,
    advanced: 20,
    agreement: 26,
    done: 30,
  };

  const statusScore = statusScoreMap[item.status];

  const updatedHoursAgo =
    (Date.now() - new Date(item.updatedAt).getTime()) / 1000 / 60 / 60;

  const freshnessScore =
    updatedHoursAgo <= 6 ? 16 : updatedHoursAgo <= 24 ? 10 : 4;

  return Math.min(
    Math.round(sourceScore + crossSourceScore + statusScore + freshnessScore),
    100
  );
}

export function calcReliabilityRank(score: number): ReliabilityRank {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

export function statusLabel(status: TransferRumour["status"]) {
  const labels = {
    rumour: "噂",
    talks: "交渉中",
    advanced: "進展あり",
    agreement: "合意間近",
    done: "完了",
  };

  return labels[status];
}

export function calcAnnualAmortization(params: {
  feeMillion: number;
  contractYears: number;
}) {
  if (params.contractYears <= 0) return 0;
  return params.feeMillion / params.contractYears;
}

export function calcAnnualSquadCost(params: {
  feeMillion: number;
  annualWageMillion: number;
  contractYears: number;
}) {
  const amortization = calcAnnualAmortization({
    feeMillion: params.feeMillion,
    contractYears: params.contractYears,
  });

  return amortization + params.annualWageMillion;
}

export function statsToRadarData(stats: PlayerStatsRadar) {
  return [
    { subject: "Pace", value: stats.pace },
    { subject: "Shooting", value: stats.shooting },
    { subject: "Passing", value: stats.passing },
    { subject: "Dribbling", value: stats.dribbling },
    { subject: "Defending", value: stats.defending },
    { subject: "Physical", value: stats.physical },
  ];
}

export function categoryClassName(category: DevelopmentCategory) {
  if (category === "自クラブ育成") return "tag green";
  if (category === "Jクラブ育成") return "tag blue";
  if (category === "協会育成") return "tag yellow";
  if (category === "自由枠") return "tag red";
  return "tag";
}
