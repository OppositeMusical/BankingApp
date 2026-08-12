import type {
  Account,
  AccountKind,
  AccountShare,
  AccountVisibility,
} from "@/lib/types/banking";
import { toMoney } from "./money";
import type { WireMember, WireMemberRole, WireSubAccount } from "../wire";

/*
 * Accounts.
 *
 * The vocabularies genuinely differ, and this is where that is absorbed:
 *
 *   UI "account"   →  wire SubAccount  (a labelled pot inside a real account)
 *   UI sharedWith  →  wire Member[]    (roles on the parent account)
 *
 * A wire `Account` is the legal container — `{ type: personal | business }`,
 * no name, no number. The things a person calls their accounts ("Everyday",
 * "Safety Net") are sub-accounts, so that is what a UI Account maps from.
 *
 * Three UI fields have no wire equivalent at all: `kind`, `last4` and
 * `interestRateBps`. They are inferred or defaulted here, and the inference is
 * marked so it is easy to delete once the contract carries them. See §"Known
 * contract gaps" in docs/api-contract.md.
 */

/**
 * Best-effort account kind from the sub-account label.
 *
 * A placeholder for a field the contract does not have. It only ever affects
 * the small grey caption under the account name.
 */
function inferKind(label: string): AccountKind {
  const text = label.toLowerCase();
  if (/(saving|safety|reserve|emergency|rainy)/.test(text)) return "savings";
  if (/(goal|fund|target|break|pause)/.test(text)) return "goal";
  if (/(card|credit)/.test(text)) return "credit";
  return "checking";
}

/**
 * Wire roles → the UI's three access levels.
 *
 * `owner` and `member` both collapse to "manage"/"spend": the UI's levels are
 * about capability, and the contract's roles are about authority. `dependent`
 * deliberately maps to "view" — openapi.yaml notes it lacks transfer
 * permissions entirely, so showing it as able to spend would be a lie.
 */
const accessByRole: Record<WireMemberRole, AccountShare["access"]> = {
  owner: "manage",
  member: "spend",
  dependent: "view",
  viewer: "view",
};

export const toAccountShare = (member: WireMember): AccountShare => ({
  personId: member.userId,
  name: member.name ?? member.email ?? "Someone with access",
  access: accessByRole[member.role],
});

/**
 * Visibility is derived, not stored.
 *
 * Anyone other than the current user having a role on the parent account makes
 * it shared — and whether they can act or only look decides which of the two
 * shared states it is.
 */
function deriveVisibility(shares: AccountShare[]): AccountVisibility {
  if (shares.length === 0) return "sole";
  return shares.some((share) => share.access !== "view") ? "joint" : "viewable";
}

export function toAccount(
  subAccount: WireSubAccount,
  options: { members?: WireMember[]; currentUserId?: string } = {},
): Account {
  const shares = (options.members ?? [])
    .filter((member) => member.userId !== options.currentUserId)
    .map(toAccountShare);

  const balance = subAccount.balance;

  return {
    id: subAccount.id,
    name: subAccount.label,
    kind: inferKind(subAccount.label),
    // Not in the contract. The last four of the sub-account id is stable and
    // unique enough to distinguish two accounts sharing a name, which is all
    // the caption is for — it is not an account number.
    last4: subAccount.id.replace(/\D/g, "").slice(-4).padStart(4, "0"),
    balance: balance ? toMoney(balance.current) : { amount: 0, currency: "USD" },
    available: balance
      ? toMoney(balance.available)
      : { amount: 0, currency: "USD" },
    visibility: deriveVisibility(shares),
    sharedWith: shares,
    // No interest rate exists on the wire; omitted rather than invented, so
    // the UI simply doesn't render the line.
  };
}
