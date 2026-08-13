/**
 * Domain types for the banking UI.
 *
 * These are hand-written against `docs/api-contract.md` and follow the wire
 * conventions the FastAPI backend will use: camelCase keys, ISO-8601 UTC
 * timestamps, and money as integer minor units + ISO-4217 code. When the
 * backend exists, `openapi-typescript` generates the equivalents from
 * /openapi.json and these become the reconciliation target.
 */

export type Money = {
  /** Integer minor units (cents). Never a float. */
  amount: number;
  /** ISO-4217 code, e.g. "USD". */
  currency: string;
};

export type AccountKind = "checking" | "savings" | "goal" | "credit";

export type AccountVisibility = "sole" | "joint" | "viewable";

export type Account = {
  id: string;
  /**
   * The wire container this account lives in. A UI account maps from a wire
   * sub-account, but moving money requires naming the parent (`fromAccountId`
   * is required on POST /transfers/internal). Absent on fixtures that predate
   * the live backend.
   */
  parentAccountId?: string;
  name: string;
  kind: AccountKind;
  /** Last four digits only — the UI never handles a full number. */
  last4: string;
  balance: Money;
  available: Money;
  visibility: AccountVisibility;
  /** People other than the owner who can see this account. */
  sharedWith: AccountShare[];
  interestRateBps?: number;
};

export type AccountShare = {
  personId: string;
  name: string;
  access: "view" | "spend" | "manage";
};

export type TransactionCategory =
  | "income"
  | "housing"
  | "groceries"
  | "transport"
  | "health"
  | "childcare"
  | "education"
  | "personal"
  | "savings"
  | "fees"
  | "other";

export type TransactionStatus = "pending" | "posted";

export type Transaction = {
  id: string;
  accountId: string;
  merchant: string;
  /** Present when the account is joint — who actually made the charge. */
  initiatedBy?: string;
  amount: Money;
  category: TransactionCategory;
  status: TransactionStatus;
  occurredAt: string;
  note?: string;
  /** Set on fee transactions so they can be surfaced in the fee tracker. */
  feeExplanation?: string;
};

export type GoalKind =
  | "emergency"
  | "career-break"
  | "caregiving"
  | "home"
  | "education"
  | "travel"
  | "custom";

export type Goal = {
  id: string;
  name: string;
  kind: GoalKind;
  saved: Money;
  target: Money;
  targetDate?: string;
  monthlyContribution?: Money;
  note?: string;
};

export type Card = {
  id: string;
  accountId: string;
  label: string;
  last4: string;
  status: "active" | "frozen";
  expiry: string;
  /** Present on wire cards; fixtures predate it. */
  virtual?: boolean;
  /** Per-transaction ceiling, when one is set. */
  limit?: Money;
};

export type Session = {
  id: string;
  device: string;
  location: string;
  lastActiveAt: string;
  current: boolean;
};

export type SpendingSlice = {
  category: TransactionCategory;
  total: Money;
};

export type MonthlyPoint = {
  /** YYYY-MM */
  month: string;
  spent: Money;
  earned: Money;
};

export type FeeSummary = {
  period: string;
  total: Money;
  /** Comparable figure at a typical high-street bank, for context. */
  typicalElsewhere: Money;
  items: { label: string; amount: Money; explanation: string }[];
};

export type CareerPauseProjection = {
  months: number;
  monthlyIncome: Money;
  /** Income not earned during the pause. */
  incomeForgone: Money;
  /** Retirement contributions missed, including employer match. */
  contributionsMissed: Money;
  /** Projected value of those contributions at retirement, compounded. */
  retirementImpact: Money;
  /** What the emergency fund needs to hold to cover the pause. */
  bufferNeeded: Money;
  bufferHeld: Money;
};

export type Person = {
  id: string;
  legalName: string;
  /** Shown throughout the UI. Changes without a legal name change. */
  displayName: string;
  pronouns?: string;
  email: string;
};
