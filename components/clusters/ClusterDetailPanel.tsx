"use client";

import { useState } from "react";
import { getCommunityColor } from "@/components/graph/utils/communityColors";
import { ClusterHistoryChart } from "./ClusterHistoryChart";
import { formatCompact, truncateAddress, formatWeek } from "@/lib/utils/format";
import type { ClusterDetailResponse, ClusterTransition } from "@/lib/types/clusters";

interface ClusterDetailPanelProps {
  data: ClusterDetailResponse | undefined;
  isLoading: boolean;
  onClose: () => void;
}

export function ClusterDetailPanel({
  data,
  isLoading,
  onClose,
}: ClusterDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"members" | "history" | "events">(
    "members"
  );

  if (isLoading) {
    return (
      <div className="h-full animate-pulse space-y-4 p-4">
        <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          ))}
        </div>
        <div className="h-48 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        No cluster selected
      </div>
    );
  }

  const { cluster, members, history, transitions } = data;
  const color = getCommunityColor(cluster.stableClusterId);

  // Compute events from transitions
  const events = computeEvents(transitions, cluster.stableClusterId);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Cluster #{cluster.stableClusterId}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Nodes</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
            {cluster.nodeCount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Edges</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
            {cluster.edgeCount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Volume</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
            {formatCompact(cluster.totalWeight)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">First Seen</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            {formatWeek(cluster.createdWeekStart)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700">
        {(["members", "history", "events"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab}
            {tab === "members" && ` (${members.length})`}
            {tab === "events" && ` (${events.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "members" && (
          <MembersTab members={members} />
        )}
        {activeTab === "history" && (
          <ClusterHistoryChart history={history} />
        )}
        {activeTab === "events" && (
          <EventsTab events={events} />
        )}
      </div>
    </div>
  );
}

interface MembersTabProps {
  members: ClusterDetailResponse["members"];
}

function MembersTab({ members }: MembersTabProps) {
  if (members.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500">
        No members found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {members.map((member) => (
        <div
          key={member.address}
          className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <div className="flex items-center gap-2">
            <code className="text-xs text-zinc-600 dark:text-zinc-400">
              {truncateAddress(member.address, 8)}
            </code>
            {member.label && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {member.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span title="Degree">{member.degree} conn</span>
            <span title="Volume">{formatCompact(member.totalWeight)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ClusterEvent {
  type: "split" | "merge" | "continued";
  weekStart: string;
  description: string;
  relatedIds: number[];
}

function computeEvents(
  transitions: ClusterTransition[],
  clusterId: number
): ClusterEvent[] {
  const events: ClusterEvent[] = [];

  // Group transitions by week
  const byWeek = new Map<string, ClusterTransition[]>();
  for (const t of transitions) {
    const key = t.weekStart;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(t);
  }

  for (const [weekStart, weekTransitions] of byWeek) {
    // Check for splits: this cluster as parent with multiple children
    const asParent = weekTransitions.filter(
      (t) => t.prevStableClusterId === clusterId
    );
    if (asParent.length > 1) {
      events.push({
        type: "split",
        weekStart,
        description: `Split into ${asParent.length} clusters`,
        relatedIds: asParent.map((t) => t.stableClusterId),
      });
    }

    // Check for merges: this cluster as child with multiple parents
    const asChild = weekTransitions.filter(
      (t) => t.stableClusterId === clusterId
    );
    if (asChild.length > 1) {
      events.push({
        type: "merge",
        weekStart,
        description: `Merged from ${asChild.length} clusters`,
        relatedIds: asChild.map((t) => t.prevStableClusterId),
      });
    }

    // Simple continuation
    if (asParent.length === 1 && asChild.length <= 1) {
      const primary = asParent.find((t) => t.isPrimary);
      if (primary) {
        events.push({
          type: "continued",
          weekStart,
          description: `Continued as cluster #${primary.stableClusterId}`,
          relatedIds: [primary.stableClusterId],
        });
      }
    }
  }

  return events.sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
}

interface EventsTabProps {
  events: ClusterEvent[];
}

function EventsTab({ events }: EventsTabProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500">
        No events recorded
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div
          key={`${event.weekStart}-${index}`}
          className="rounded border border-zinc-100 p-3 dark:border-zinc-800"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                event.type === "split"
                  ? "bg-orange-500"
                  : event.type === "merge"
                    ? "bg-purple-500"
                    : "bg-zinc-400"
              }`}
            />
            <span className="text-xs font-medium text-zinc-900 dark:text-white capitalize">
              {event.type}
            </span>
            <span className="text-xs text-zinc-500">
              {formatWeek(event.weekStart)}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {event.description}
          </p>
          {event.relatedIds.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {event.relatedIds.map((id) => (
                <span
                  key={id}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800"
                >
                  #{id}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
