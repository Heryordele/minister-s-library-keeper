export type DeletionCheck = {
  isInstitution: boolean;
  /** Lending records that have not been cleared. */
  openRecords: number;
  /** When the user last downloaded their data, or null if never. */
  lastExportedAt: string | null;
};

/**
 * Returns why an account cannot be deleted yet, or null if it can.
 * Institution accounts must export their data (or clear their records) first,
 * because the library's lending history goes with the account.
 */
export function deletionBlockReason(check: DeletionCheck): string | null {
  if (!check.isInstitution) return null;
  if (check.openRecords === 0) return null;
  if (check.lastExportedAt) return null;
  return "Before deleting this account, download your data or clear your returned and lost lending records.";
}
