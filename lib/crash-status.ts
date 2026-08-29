import { kvGetManyWithTtl, kvSet } from "./store";

const STATUS_PREFIX = "crash:issue-status:";

export const CRASH_ISSUE_STATUSES = ["open", "investigating", "fixed", "ignored"] as const;
export type CrashIssueStatus = (typeof CRASH_ISSUE_STATUSES)[number];

export interface CrashIssueState {
  status: CrashIssueStatus;
  updatedAt: number;
}

export function isCrashIssueStatus(value: unknown): value is CrashIssueStatus {
  return typeof value === "string" && CRASH_ISSUE_STATUSES.includes(value as CrashIssueStatus);
}

function stateKey(extension: string, fingerprint: string): string {
  return `${STATUS_PREFIX}${extension}:${fingerprint}`;
}

export async function getCrashIssueStates(
  issues: Array<{ extension: string; fingerprint: string }>,
): Promise<Map<string, CrashIssueState>> {
  const rows = await kvGetManyWithTtl(issues.map((issue) => stateKey(issue.extension, issue.fingerprint)));
  const states = new Map<string, CrashIssueState>();
  rows.forEach((row, index) => {
    if (!row.value) return;
    try {
      const parsed = JSON.parse(row.value) as Partial<CrashIssueState>;
      if (!isCrashIssueStatus(parsed.status) || !Number.isFinite(parsed.updatedAt)) return;
      const issue = issues[index];
      states.set(`${issue.extension}:${issue.fingerprint}`, {
        status: parsed.status,
        updatedAt: Number(parsed.updatedAt),
      });
    } catch {
      // Ignore malformed admin metadata without hiding the crash itself.
    }
  });
  return states;
}

export async function setCrashIssueStatus(
  extension: string,
  fingerprint: string,
  status: CrashIssueStatus,
): Promise<CrashIssueState> {
  const state = { status, updatedAt: Date.now() };
  await kvSet(stateKey(extension, fingerprint), JSON.stringify(state));
  return state;
}
