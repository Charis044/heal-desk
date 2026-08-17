import {
  buildInsightsSnapshot,
  countableEntries,
  pendingCount,
  shouldAutoRefresh,
} from "./insights";
import {
  loadEntries,
  loadInsightsSnapshot,
  loadProfile,
  saveInsightsSnapshot,
} from "./storage";
import type { InsightsResponse, InsightsSnapshot } from "./types";

export async function refreshInsightsFromDisk(): Promise<InsightsSnapshot> {
  const entries = await loadEntries();
  const profile = await loadProfile();
  const snapshot = buildInsightsSnapshot(
    entries,
    profile?.support_preference ?? null,
  );
  await saveInsightsSnapshot(snapshot);
  return snapshot;
}

export async function maybeAutoRefreshInsights(): Promise<void> {
  const entries = await loadEntries();
  const countable = countableEntries(entries);
  const prev = await loadInsightsSnapshot();
  if (!shouldAutoRefresh(countable.length, prev)) return;
  await refreshInsightsFromDisk();
}

export async function readInsightsResponse(): Promise<InsightsResponse> {
  const entries = await loadEntries();
  const snapshot = await loadInsightsSnapshot();
  return {
    snapshot,
    pending_count: pendingCount(entries, snapshot),
    countable_count: countableEntries(entries).length,
  };
}
