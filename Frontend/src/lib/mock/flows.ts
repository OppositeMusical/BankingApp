import type {
  Flow,
  FlowRun,
  FlowSourceSuggestion,
} from "@/lib/types/flows";
import { NOW } from "./data";

/*
 * Flow fixtures, shaped like the planned /flows responses.
 * Spec: docs/flow-budgets.md
 */

const usd = (amount: number) => ({ amount, currency: "USD" });

const daysAgo = (days: number, hour = 8) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const flows: Flow[] = [
  {
    id: "flow_northwind",
    name: "Northwind",
    state: "active",
    source: {
      id: "src_northwind",
      displayName: "Northwind Design Studio",
      matchPatterns: ["NORTHWIND DESIGN STUDIO ACH"],
      arrivesInAccountId: "acc_checking",
      cadence: "biweekly",
      typicalAmount: usd(612_500),
      lastSeenAt: daysAgo(1),
    },
    setAsides: [],
    splits: [
      {
        id: "spl_nw_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        isRemainder: true,
      },
      {
        id: "spl_nw_safety",
        destination: { kind: "goal", goalId: "goal_emergency" },
        percentage: 20,
        isRemainder: false,
      },
      {
        id: "spl_nw_career",
        destination: { kind: "goal", goalId: "goal_career" },
        percentage: 25,
        isRemainder: false,
      },
      {
        id: "spl_nw_house",
        destination: { kind: "account", accountId: "acc_joint" },
        percentage: 15,
        isRemainder: false,
      },
    ],
    createdAt: daysAgo(120),
    lastRunAt: daysAgo(1),
  },
  {
    id: "flow_two_rivers",
    name: "Two Rivers",
    state: "paused",
    source: {
      id: "src_two_rivers",
      displayName: "Two Rivers Consulting",
      matchPatterns: ["TWO RIVERS CONSULT"],
      arrivesInAccountId: "acc_checking",
      cadence: "monthly",
      typicalAmount: usd(180_000),
      lastSeenAt: daysAgo(34),
    },
    setAsides: [],
    splits: [
      {
        id: "spl_tr_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        isRemainder: true,
      },
      {
        id: "spl_tr_deposit",
        destination: { kind: "goal", goalId: "goal_home" },
        percentage: 70,
        isRemainder: false,
      },
    ],
    createdAt: daysAgo(88),
    lastRunAt: daysAgo(34),
  },
  {
    id: "flow_care",
    name: "Mum's care fund",
    state: "needs-attention",
    source: {
      id: "src_bright_hours",
      displayName: "Bright Hours Care Agency",
      matchPatterns: ["BRIGHT HOURS CARE"],
      arrivesInAccountId: "acc_checking",
      cadence: "monthly",
      typicalAmount: usd(96_000),
      lastSeenAt: daysAgo(29),
    },
    setAsides: [
      {
        id: "sa_care_meds",
        destination: { kind: "account", accountId: "acc_savings" },
        amount: usd(18_000),
        label: "Prescriptions",
      },
    ],
    splits: [
      {
        id: "spl_care_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        isRemainder: true,
      },
      {
        id: "spl_care_goal",
        destination: { kind: "goal", goalId: "goal_care" },
        percentage: 60,
        isRemainder: false,
      },
    ],
    createdAt: daysAgo(45),
    attentionReason:
      "The Talents Card is frozen, so the 60% share has nowhere to go. Unfreeze it, or pick a different destination.",
  },
];

export const flowRuns: FlowRun[] = [
  {
    id: "run_nw_3",
    flowId: "flow_northwind",
    transactionId: "txn_03",
    depositAmount: usd(612_500),
    occurredAt: daysAgo(1),
    lines: [
      {
        splitId: "spl_nw_safety",
        destination: { kind: "goal", goalId: "goal_emergency" },
        amount: usd(122_500),
        status: "sent",
      },
      {
        splitId: "spl_nw_career",
        destination: { kind: "goal", goalId: "goal_career" },
        amount: usd(153_125),
        status: "sent",
      },
      {
        splitId: "spl_nw_house",
        destination: { kind: "account", accountId: "acc_joint" },
        amount: usd(91_875),
        status: "sent",
      },
      {
        splitId: "spl_nw_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        amount: usd(245_000),
        status: "sent",
      },
    ],
  },
  {
    id: "run_nw_2",
    flowId: "flow_northwind",
    transactionId: "txn_15",
    depositAmount: usd(612_500),
    occurredAt: daysAgo(16),
    lines: [
      {
        splitId: "spl_nw_safety",
        destination: { kind: "goal", goalId: "goal_emergency" },
        amount: usd(122_500),
        status: "sent",
      },
      {
        splitId: "spl_nw_career",
        destination: { kind: "goal", goalId: "goal_career" },
        amount: usd(153_125),
        status: "sent",
      },
      {
        splitId: "spl_nw_house",
        destination: { kind: "account", accountId: "acc_joint" },
        amount: usd(0),
        status: "redirected",
        note: "That account is frozen, so this share went to the rest instead.",
      },
      {
        splitId: "spl_nw_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        amount: usd(336_875),
        status: "sent",
        note: "Includes a share that couldn't reach its destination.",
      },
    ],
  },
  {
    id: "run_nw_1",
    flowId: "flow_northwind",
    // An unusually small invoice — shows the arithmetic scaling down.
    transactionId: "txn_prev_1",
    depositAmount: usd(412_733),
    occurredAt: daysAgo(30),
    lines: [
      {
        splitId: "spl_nw_safety",
        destination: { kind: "goal", goalId: "goal_emergency" },
        amount: usd(82_546),
        status: "sent",
      },
      {
        splitId: "spl_nw_career",
        destination: { kind: "goal", goalId: "goal_career" },
        amount: usd(103_183),
        status: "sent",
      },
      {
        splitId: "spl_nw_house",
        destination: { kind: "account", accountId: "acc_joint" },
        amount: usd(61_909),
        status: "sent",
      },
      {
        splitId: "spl_nw_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        amount: usd(165_095),
        status: "sent",
      },
    ],
  },
  {
    id: "run_tr_1",
    flowId: "flow_two_rivers",
    transactionId: "txn_prev_2",
    depositAmount: usd(180_000),
    occurredAt: daysAgo(34),
    lines: [
      {
        splitId: "spl_tr_deposit",
        destination: { kind: "goal", goalId: "goal_home" },
        amount: usd(126_000),
        status: "sent",
      },
      {
        splitId: "spl_tr_rest",
        destination: { kind: "account", accountId: "acc_checking" },
        amount: usd(54_000),
        status: "sent",
      },
    ],
  },
];

/** Detected recurring credits not yet attached to a Flow. */
export const sourceSuggestions: FlowSourceSuggestion[] = [
  {
    id: "sug_northwind",
    displayName: "Northwind Design Studio",
    matchPatterns: ["NORTHWIND DESIGN STUDIO ACH"],
    arrivesInAccountId: "acc_checking",
    cadence: "biweekly",
    typicalAmount: usd(612_500),
    recentAmounts: [usd(612_500), usd(612_500), usd(412_733)],
    lastSeenAt: daysAgo(1),
    totalReceived: usd(7_962_733),
    alreadyUsed: true,
  },
  {
    id: "sug_meridian",
    displayName: "Meridian Studio",
    matchPatterns: ["MERIDIAN STUDIO INV"],
    arrivesInAccountId: "acc_checking",
    cadence: "irregular",
    typicalAmount: usd(284_000),
    recentAmounts: [usd(310_000), usd(284_000), usd(196_500)],
    lastSeenAt: daysAgo(12),
    totalReceived: usd(2_374_500),
  },
  {
    id: "sug_two_rivers",
    displayName: "Two Rivers Consulting",
    matchPatterns: ["TWO RIVERS CONSULT"],
    arrivesInAccountId: "acc_checking",
    cadence: "monthly",
    typicalAmount: usd(180_000),
    recentAmounts: [usd(180_000), usd(180_000), usd(180_000)],
    lastSeenAt: daysAgo(34),
    totalReceived: usd(1_620_000),
    alreadyUsed: true,
  },
  {
    id: "sug_bright_hours",
    displayName: "Bright Hours Care Agency",
    matchPatterns: ["BRIGHT HOURS CARE"],
    arrivesInAccountId: "acc_checking",
    cadence: "monthly",
    typicalAmount: usd(96_000),
    recentAmounts: [usd(96_000), usd(96_000), usd(88_000)],
    lastSeenAt: daysAgo(29),
    totalReceived: usd(848_000),
    alreadyUsed: true,
  },
  {
    id: "sug_hallow",
    displayName: "Hallow Press (royalties)",
    matchPatterns: ["HALLOW PRESS ROYALTY"],
    arrivesInAccountId: "acc_savings",
    cadence: "irregular",
    typicalAmount: usd(41_200),
    recentAmounts: [usd(52_400), usd(41_200), usd(29_800)],
    lastSeenAt: daysAgo(52),
    totalReceived: usd(263_800),
  },
];
