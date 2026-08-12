import { z } from "zod";

/*
 * Runtime schemas for the wire format, hand-written from openapi.yaml.
 *
 * These describe the backend's shapes, not the UI's — nothing in here should
 * ever be handed to a component. `adapters/` turns these into the domain types
 * in lib/types, which is the only thing screens know about.
 *
 * Compile-time drift is caught separately: `npm run gen:api` regenerates
 * generated/schema.d.ts straight from openapi.yaml, and `wire.contract.test.ts`
 * asserts these schemas still line up with it.
 */

export const MoneySchema = z.object({
  /** Integer minor units. The only field arithmetic may touch. */
  amount: z.number().int(),
  /** Display string. Never parsed back into a number. */
  formatted: z.string(),
  currency: z.string().length(3),
});
export type WireMoney = z.infer<typeof MoneySchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  kycStatus: z.enum(["unverified", "pending", "verified", "rejected"]),
  createdAt: z.string(),
});
export type WireUser = z.infer<typeof UserSchema>;

export const AccountSchema = z.object({
  id: z.string(),
  type: z.enum(["personal", "business"]),
  status: z.enum(["active", "frozen", "closed"]),
  currency: z.string(),
  balance: MoneySchema,
  available: MoneySchema,
  held: MoneySchema,
  createdAt: z.string(),
});
export type WireAccount = z.infer<typeof AccountSchema>;

export const BalanceSchema = z.object({
  accountId: z.string(),
  subAccountId: z.string().nullable(),
  current: MoneySchema,
  held: MoneySchema,
  available: MoneySchema,
});
export type WireBalance = z.infer<typeof BalanceSchema>;

export const SubAccountSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  holderUserId: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.string(),
});

export const SubAccountSchema = SubAccountSummarySchema.extend({
  balance: BalanceSchema.optional(),
});
export type WireSubAccount = z.infer<typeof SubAccountSchema>;

export const MemberRoleSchema = z.enum([
  "owner",
  "member",
  "dependent",
  "viewer",
]);
export type WireMemberRole = z.infer<typeof MemberRoleSchema>;

export const MemberSchema = z.object({
  userId: z.string(),
  role: MemberRoleSchema,
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});
export type WireMember = z.infer<typeof MemberSchema>;

export const EntryTypeSchema = z.enum([
  "transfer_internal",
  "transfer_external",
  "external_deposit",
  "hold",
  "hold_release",
  "card_settlement",
  "subaccount_funding",
  "brokerage_funding",
  "fee",
  "interest",
  "reversal",
  "adjustment",
]);

export const TransactionSchema = z.object({
  id: z.string(),
  transferId: z.string(),
  accountId: z.string(),
  subAccountId: z.string().nullable().optional(),
  amount: MoneySchema,
  signedAmount: MoneySchema,
  direction: z.enum(["debit", "credit"]),
  type: EntryTypeSchema,
  status: z.enum(["pending", "posted"]),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  merchantName: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type WireTransaction = z.infer<typeof TransactionSchema>;

export const TransferSchema = z.object({
  id: z.string(),
  reference: z.string(),
  type: z.enum([
    "internal",
    "external_ach",
    "subaccount_funding",
    "card_auth",
    "card_settlement",
    "brokerage_funding",
    "rule_action",
    "adjustment",
  ]),
  status: z.enum(["pending", "settled", "failed", "canceled"]),
  amount: MoneySchema,
  description: z.string().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  sourceAccountId: z.string().nullable().optional(),
  sourceSubAccountId: z.string().nullable().optional(),
  destinationAccountId: z.string().nullable().optional(),
  destinationSubAccountId: z.string().nullable().optional(),
  settledAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type WireTransfer = z.infer<typeof TransferSchema>;

export const TriggerTypeSchema = z.enum([
  "deposit_detected",
  "schedule",
  "budget_exceeded",
  "balance_below",
  "transaction_posted",
]);
export type WireTriggerType = z.infer<typeof TriggerTypeSchema>;

export const ActionTypeSchema = z.enum([
  "internal_transfer",
  "buy_order",
  "sell_order",
  "notify",
]);
export type WireActionType = z.infer<typeof ActionTypeSchema>;

/*
 * `triggerConfig` and `actionConfig` are untyped objects in the contract —
 * their shape depends on the trigger and action kind, and openapi.yaml
 * documents them only in prose. These describe the two variants Flows use;
 * `passthrough` keeps any field we don't model rather than dropping it.
 */
export const DepositTriggerConfigSchema = z
  .object({
    minAmount: z.number().int().optional(),
    linkedAccountId: z.string().optional(),
    merchantContains: z.string().optional(),
  })
  .passthrough();

export const InternalTransferActionConfigSchema = z
  .object({
    toSubAccountId: z.string().optional(),
    toAccountId: z.string().optional(),
    amount: z.number().int().optional(),
    percentOfTrigger: z.number().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const RuleSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  triggerType: TriggerTypeSchema,
  triggerConfig: z.record(z.string(), z.unknown()).default({}),
  actionType: ActionTypeSchema,
  actionConfig: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean(),
  lastFiredAt: z.string().nullable().optional(),
  fireCount: z.number().int().optional(),
  createdAt: z.string(),
});
export type WireRule = z.infer<typeof RuleSchema>;

export const RuleExecutionSchema = z.object({
  id: z.string(),
  status: z.enum(["succeeded", "failed", "skipped"]),
  transferId: z.string().nullable().optional(),
  orderId: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  triggeredBy: z.string(),
  createdAt: z.string(),
});
export type WireRuleExecution = z.infer<typeof RuleExecutionSchema>;

export const SpendCategorySchema = z.enum([
  "groceries",
  "dining",
  "transport",
  "fuel",
  "travel",
  "shopping",
  "entertainment",
  "utilities",
  "rent",
  "healthcare",
  "education",
  "subscriptions",
  "transfers",
  "income",
  "other",
]);
export type WireSpendCategory = z.infer<typeof SpendCategorySchema>;

export const BudgetSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  subAccountId: z.string().nullable().optional(),
  category: SpendCategorySchema,
  monthlyLimit: MoneySchema,
  currentSpend: MoneySchema,
  remaining: MoneySchema,
  exceeded: z.boolean(),
  percentUsed: z.number().int(),
  periodStart: z.string(),
});
export type WireBudget = z.infer<typeof BudgetSchema>;

export const CardSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  subAccountId: z.string().nullable().optional(),
  last4: z.string(),
  status: z.string(),
  expiryMonth: z.number().int().optional(),
  expiryYear: z.number().int().optional(),
  createdAt: z.string(),
});
export type WireCard = z.infer<typeof CardSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().int().optional(),
  user: UserSchema.optional(),
});
export type WireAuthTokens = z.infer<typeof AuthTokensSchema>;

export const ReadinessSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  checks: z
    .object({
      database: z.enum(["ok", "failing"]).optional(),
      redis: z.enum(["ok", "failing"]).optional(),
    })
    .optional(),
  providers: z
    .object({
      plaid: z.enum(["simulated", "sandbox"]).optional(),
      alpaca: z.enum(["simulated", "paper"]).optional(),
    })
    .optional(),
  uptimeSeconds: z.number().int().optional(),
});
export type WireReadiness = z.infer<typeof ReadinessSchema>;

/*
 * Envelopes. The contract wraps every payload in a key named after the
 * resource — `{ accounts: [...] }`, `{ rule: {...} }` — rather than a uniform
 * `data`. These helpers keep that detail in one place.
 */

/** `{ <key>: [ ...items ] }` */
export const listOf = <K extends string, T extends z.ZodTypeAny>(
  key: K,
  item: T,
) => z.object({ [key]: z.array(item) } as Record<K, z.ZodArray<T>>);

/** `{ <key>: item }` */
export const oneOf = <K extends string, T extends z.ZodTypeAny>(
  key: K,
  item: T,
) => z.object({ [key]: item } as Record<K, T>);

/**
 * Cursor-paginated list. `nextCursor` is opaque — it is passed straight back,
 * never parsed.
 */
export const pageOf = <K extends string, T extends z.ZodTypeAny>(
  key: K,
  item: T,
) =>
  z.object({
    ...({ [key]: z.array(item) } as Record<K, z.ZodArray<T>>),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
