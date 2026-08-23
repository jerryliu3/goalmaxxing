import {
  DEMO_ALEX_ID,
  DEMO_UNSUPPORTED_MESSAGE,
} from "@/features/demo/demo-ids";
import { getDemoStore } from "@/features/demo/demo-store";
import type { TeamStateRpcRow } from "@cadence/shared/social/team";

type DemoRow = Record<string, unknown>;

const WRITE_ERROR = {
  message: DEMO_UNSUPPORTED_MESSAGE,
  code: "demo_unsupported",
};

function tableRows(table: string): DemoRow[] {
  const snapshot = getDemoStore();
  switch (table) {
    case "goals":
      return snapshot.goals as unknown as DemoRow[];
    case "profiles":
      return snapshot.profiles as unknown as DemoRow[];
    case "completions":
      return snapshot.completions as unknown as DemoRow[];
    case "team_members":
      return snapshot.teamMembers as unknown as DemoRow[];
    case "goal_links":
      return snapshot.goalLinks as unknown as DemoRow[];
    case "goal_shares":
      return snapshot.goalShares as unknown as DemoRow[];
    case "notification_schedules":
      return snapshot.notificationSchedules as unknown as DemoRow[];
    default:
      return [];
  }
}

function compareValues(left: unknown, right: unknown) {
  if (left === right) {
    return 0;
  }
  if (left == null) {
    return -1;
  }
  if (right == null) {
    return 1;
  }
  return String(left).localeCompare(String(right), "en");
}

class DemoQuery {
  private filters: Array<(row: DemoRow) => boolean> = [];
  private orderings: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private resultMode: "many" | "single" | "maybeSingle" = "many";
  private write = false;

  constructor(private readonly table: string) {}

  select() {
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }
  in(column: string, values: unknown[]) {
    const set = new Set(values);
    this.filters.push((row) => set.has(row[column]));
    return this;
  }
  is(column: string, value: null) {
    this.filters.push((row) => row[column] == value);
    return this;
  }
  gt(column: string, value: unknown) {
    this.filters.push((row) => compareValues(row[column], value) > 0);
    return this;
  }
  gte(column: string, value: unknown) {
    this.filters.push((row) => compareValues(row[column], value) >= 0);
    return this;
  }
  lt(column: string, value: unknown) {
    this.filters.push((row) => compareValues(row[column], value) < 0);
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.orderings.push({ column, ascending: options?.ascending !== false });
    return this;
  }
  limit(count: number) {
    this.limitCount = count;
    return this;
  }
  maybeSingle() {
    this.resultMode = "maybeSingle";
    return this;
  }
  single() {
    this.resultMode = "single";
    return this;
  }
  insert() {
    this.write = true;
    return this;
  }
  update() {
    this.write = true;
    return this;
  }
  upsert() {
    this.write = true;
    return this;
  }
  delete() {
    this.write = true;
    return this;
  }

  private resolve() {
    if (this.write) {
      return { data: null, error: WRITE_ERROR };
    }
    let rows = tableRows(this.table).filter((row) =>
      this.filters.every((filter) => filter(row))
    );
    for (const ordering of this.orderings) {
      rows = [...rows].sort((left, right) => {
        const compared = compareValues(left[ordering.column], right[ordering.column]);
        return ordering.ascending ? compared : -compared;
      });
    }
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }
    if (this.resultMode === "maybeSingle") {
      return { data: rows[0] ?? null, error: null };
    }
    if (this.resultMode === "single") {
      if (rows.length !== 1) {
        return { data: null, error: { message: "Row not found.", code: "PGRST116" } };
      }
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(this.resolve()).then(onfulfilled, onrejected);
  }
}

function teamStateRows(): TeamStateRpcRow[] {
  const snapshot = getDemoStore();
  const partner = snapshot.duoState.activePartner;
  if (!partner) {
    return [];
  }
  return [
    {
      team_id: partner.teamId,
      status: "active",
      partner_id: partner.partnerId,
      partner_username: partner.partnerUsername,
      partner_display_name: partner.partnerDisplayName,
      partner_avatar_url: partner.partnerAvatarUrl,
      invite_message: null,
      invited_at: snapshot.profiles[0]?.created_at ?? snapshot.asOfDate,
      accepted_at: snapshot.profiles[0]?.created_at ?? snapshot.asOfDate,
      closed_at: null,
      is_incoming: false,
    },
  ];
}

export function getDemoSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: DEMO_ALEX_ID,
            email: "alex@example.com",
            user_metadata: { display_name: "Alex" },
          },
        },
        error: null,
      }),
    },
    from(table: string) {
      return new DemoQuery(table);
    },
    rpc(name: string) {
      if (name === "get_team_state") {
        return Promise.resolve({ data: teamStateRows(), error: null });
      }
      if (name === "list_planner_tasks") {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: WRITE_ERROR });
    },
    storage: {
      from() {
        return {
          createSignedUrl: async () => ({ data: null, error: null }),
        };
      },
    },
  };
}
