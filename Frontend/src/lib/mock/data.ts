import type {
  Account,
  Card,
  CareerPauseProjection,
  FeeSummary,
  Goal,
  MonthlyPoint,
  Person,
  Session,
  SpendingSlice,
  Transaction,
} from "@/lib/types/banking";

/*
 * Fixtures shaped exactly like the planned FastAPI responses. When the backend
 * lands, these move behind MSW handlers and the screens don't change.
 *
 * Dates are anchored to a fixed reference instant rather than `new Date()` so
 * server and client render identical markup and the UI is deterministic.
 */
export const NOW = new Date("2026-08-02T14:30:00.000Z");

const usd = (amount: number) => ({ amount, currency: "USD" });

/** Days before NOW, as an ISO string. */
const daysAgo = (days: number, hour = 12, minute = 0) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const currentPerson: Person = {
  id: "per_1",
  legalName: "Naomi A. Okonkwo",
  displayName: "Naomi",
  pronouns: "she/her",
  email: "naomi@example.com",
};

export const accounts: Account[] = [
  {
    id: "acc_checking",
    name: "Everyday",
    kind: "checking",
    last4: "4417",
    balance: usd(482_355),
    available: usd(468_020),
    visibility: "sole",
    sharedWith: [],
  },
  {
    id: "acc_joint",
    name: "Household",
    kind: "checking",
    last4: "9082",
    balance: usd(311_400),
    available: usd(311_400),
    visibility: "joint",
    sharedWith: [{ personId: "per_2", name: "Daniel O.", access: "spend" }],
  },
  {
    id: "acc_savings",
    name: "Safety Net",
    kind: "savings",
    last4: "7731",
    balance: usd(1_284_000),
    available: usd(1_284_000),
    visibility: "sole",
    sharedWith: [],
    interestRateBps: 415,
  },
  {
    id: "acc_credit",
    name: "Aster Card",
    kind: "credit",
    last4: "2265",
    balance: usd(-84_120),
    available: usd(415_880),
    visibility: "sole",
    sharedWith: [],
  },
];

export const transactions: Transaction[] = [
  {
    id: "txn_01",
    accountId: "acc_checking",
    merchant: "Ivy & Fern Market",
    amount: usd(-8_745),
    category: "groceries",
    status: "pending",
    occurredAt: daysAgo(0, 11, 20),
  },
  {
    id: "txn_02",
    accountId: "acc_joint",
    merchant: "Brightside Nursery",
    initiatedBy: "Daniel O.",
    amount: usd(-125_000),
    category: "childcare",
    status: "pending",
    occurredAt: daysAgo(0, 9, 5),
    note: "September deposit",
  },
  {
    id: "txn_03",
    accountId: "acc_checking",
    merchant: "Northwind Design Studio",
    amount: usd(612_500),
    category: "income",
    status: "posted",
    occurredAt: daysAgo(1, 8, 0),
    note: "Invoice 2026-14",
  },
  {
    id: "txn_04",
    accountId: "acc_checking",
    merchant: "Metro Transit",
    amount: usd(-2_800),
    category: "transport",
    status: "posted",
    occurredAt: daysAgo(1, 18, 40),
  },
  {
    id: "txn_05",
    accountId: "acc_credit",
    merchant: "Halden Books",
    amount: usd(-4_299),
    category: "personal",
    status: "posted",
    occurredAt: daysAgo(2, 15, 10),
  },
  {
    id: "txn_06",
    accountId: "acc_joint",
    merchant: "Lumen Energy",
    initiatedBy: "Naomi",
    amount: usd(-14_310),
    category: "housing",
    status: "posted",
    occurredAt: daysAgo(3, 7, 30),
  },
  {
    id: "txn_07",
    accountId: "acc_savings",
    merchant: "Transfer to Safety Net",
    amount: usd(60_000),
    category: "savings",
    status: "posted",
    occurredAt: daysAgo(4, 6, 0),
  },
  {
    id: "txn_08",
    accountId: "acc_checking",
    merchant: "Dr. Okafor — Wellness",
    amount: usd(-9_500),
    category: "health",
    status: "posted",
    occurredAt: daysAgo(5, 13, 15),
  },
  {
    id: "txn_09",
    accountId: "acc_credit",
    merchant: "Foreign transaction fee",
    amount: usd(-310),
    category: "fees",
    status: "posted",
    occurredAt: daysAgo(6, 20, 25),
    feeExplanation:
      "1% of a €28.40 purchase made in euros. We charge this at cost — we don't add a markup on the exchange rate.",
  },
  {
    id: "txn_10",
    accountId: "acc_checking",
    merchant: "Verity Coworking",
    amount: usd(-32_000),
    category: "personal",
    status: "posted",
    occurredAt: daysAgo(7, 10, 45),
  },
  {
    id: "txn_11",
    accountId: "acc_joint",
    merchant: "Cedar Street Rent",
    initiatedBy: "Naomi",
    amount: usd(-215_000),
    category: "housing",
    status: "posted",
    occurredAt: daysAgo(9, 8, 0),
  },
  {
    id: "txn_12",
    accountId: "acc_checking",
    merchant: "Sana Pharmacy",
    amount: usd(-3_640),
    category: "health",
    status: "posted",
    occurredAt: daysAgo(11, 17, 5),
  },
  {
    id: "txn_13",
    accountId: "acc_checking",
    merchant: "Continuing Ed — UX Research",
    amount: usd(-49_900),
    category: "education",
    status: "posted",
    occurredAt: daysAgo(13, 12, 0),
    note: "Certification, reimbursable",
  },
  {
    id: "txn_14",
    accountId: "acc_checking",
    merchant: "Ivy & Fern Market",
    amount: usd(-11_240),
    category: "groceries",
    status: "posted",
    occurredAt: daysAgo(15, 16, 30),
  },
  {
    id: "txn_15",
    accountId: "acc_checking",
    merchant: "Northwind Design Studio",
    amount: usd(612_500),
    category: "income",
    status: "posted",
    occurredAt: daysAgo(16, 8, 0),
  },
];

export const goals: Goal[] = [
  {
    id: "goal_emergency",
    name: "Safety net",
    kind: "emergency",
    saved: usd(1_284_000),
    target: usd(1_800_000),
    monthlyContribution: usd(60_000),
    note: "Six months of essential costs.",
  },
  {
    id: "goal_career",
    name: "Career break",
    kind: "career-break",
    saved: usd(742_000),
    target: usd(2_400_000),
    targetDate: "2027-09-01T00:00:00.000Z",
    monthlyContribution: usd(85_000),
    note: "Nine months to retrain, without touching the safety net.",
  },
  {
    id: "goal_care",
    name: "Caring for Mum",
    kind: "caregiving",
    saved: usd(318_000),
    target: usd(600_000),
    monthlyContribution: usd(25_000),
  },
  {
    id: "goal_home",
    name: "Deposit",
    kind: "home",
    saved: usd(4_120_000),
    target: usd(9_000_000),
    targetDate: "2028-06-01T00:00:00.000Z",
    monthlyContribution: usd(140_000),
  },
];

export const cards: Card[] = [
  {
    id: "card_1",
    accountId: "acc_checking",
    label: "Everyday debit",
    last4: "4417",
    status: "active",
    expiry: "09/29",
  },
  {
    id: "card_2",
    accountId: "acc_credit",
    label: "Aster Card",
    last4: "2265",
    status: "active",
    expiry: "02/30",
  },
];

export const sessions: Session[] = [
  {
    id: "ses_1",
    device: "MacBook Pro · Chrome",
    location: "Chicago, IL",
    lastActiveAt: daysAgo(0, 14, 25),
    current: true,
  },
  {
    id: "ses_2",
    device: "iPhone 16 · Aster app",
    location: "Chicago, IL",
    lastActiveAt: daysAgo(0, 8, 10),
    current: false,
  },
  {
    id: "ses_3",
    device: "iPad · Safari",
    location: "Evanston, IL",
    lastActiveAt: daysAgo(12, 21, 40),
    current: false,
  },
];

export const spendingByCategory: SpendingSlice[] = [
  { category: "housing", total: usd(229_310) },
  { category: "childcare", total: usd(125_000) },
  { category: "education", total: usd(49_900) },
  { category: "personal", total: usd(36_299) },
  { category: "groceries", total: usd(19_985) },
  { category: "health", total: usd(13_140) },
  { category: "transport", total: usd(2_800) },
  { category: "fees", total: usd(310) },
];

export const monthlyTrend: MonthlyPoint[] = [
  { month: "2026-03", spent: usd(408_200), earned: usd(1_225_000) },
  { month: "2026-04", spent: usd(512_640), earned: usd(1_225_000) },
  { month: "2026-05", spent: usd(447_910), earned: usd(1_225_000) },
  { month: "2026-06", spent: usd(603_150), earned: usd(1_837_500) },
  { month: "2026-07", spent: usd(476_744), earned: usd(1_225_000) },
  { month: "2026-08", spent: usd(133_745), earned: usd(612_500) },
];

export const feeSummary: FeeSummary = {
  period: "2026-08",
  total: usd(310),
  typicalElsewhere: usd(4_200),
  items: [
    {
      label: "Foreign transaction",
      amount: usd(310),
      explanation:
        "1% of a €28.40 purchase. Charged at cost, with no markup on the exchange rate.",
    },
  ],
};

export const careerPause: CareerPauseProjection = {
  months: 9,
  monthlyIncome: usd(612_500),
  incomeForgone: usd(5_512_500),
  contributionsMissed: usd(551_250),
  retirementImpact: usd(1_842_000),
  bufferNeeded: usd(2_400_000),
  bufferHeld: usd(742_000),
};
