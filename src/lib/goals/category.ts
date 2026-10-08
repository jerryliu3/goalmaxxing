import { GOAL_CATEGORY_COLORS, goalCategoryPair } from "@cadence/shared/brand";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export interface GoalCategory {
  key: string;
  label: string;
  aliases: string[];
  color: string;
  sortOrder: number;
}

export type CategoryPresetId =
  | "health"
  | "career"
  | "personal"
  | "relationships"
  | "finance"
  | "other";
export type CategorySelection = CategoryPresetId | typeof CATEGORY_CUSTOM_VALUE;

export const CATEGORY_CUSTOM_VALUE = "custom";

const GENERIC_OTHER_LABELS = new Set(["other"]);
const CATEGORY_PRESET_IDS: readonly CategoryPresetId[] = [
  "health",
  "career",
  "personal",
  "relationships",
  "finance",
  "other",
];

function isCategoryPresetId(value: string): value is CategoryPresetId {
  return (CATEGORY_PRESET_IDS as readonly string[]).includes(value);
}

/** Mirrors the goal_categories rows; colors come from the shared category palette. */
export const DEFAULT_GOAL_CATEGORIES: GoalCategory[] = [
  {
    key: "health",
    label: "Health",
    aliases: [],
    color: GOAL_CATEGORY_COLORS.health,
    sortOrder: 10,
  },
  {
    key: "career",
    label: "Career",
    aliases: [],
    color: GOAL_CATEGORY_COLORS.career,
    sortOrder: 20,
  },
  {
    key: "personal",
    label: "Personal",
    aliases: [],
    color: GOAL_CATEGORY_COLORS.personal,
    sortOrder: 30,
  },
  {
    key: "relationships",
    label: "Interpersonal",
    aliases: ["Relationships", "Relationship"],
    color: GOAL_CATEGORY_COLORS.relationships,
    sortOrder: 40,
  },
  {
    key: "finance",
    label: "Finance",
    aliases: [],
    color: GOAL_CATEGORY_COLORS.finance,
    sortOrder: 50,
  },
  {
    key: "other",
    label: "Other",
    aliases: [],
    color: GOAL_CATEGORY_COLORS.other,
    sortOrder: 999,
  },
];

export const CATEGORY_PRESETS = DEFAULT_GOAL_CATEGORIES.filter(
  (
    category
  ): category is GoalCategory & {
    key: Exclude<CategoryPresetId, "other">;
  } => isCategoryPresetId(category.key) && category.key !== "other"
).map((category) => ({
  id: category.key,
  label: category.label,
}));

function normalizeCategoryCatalog(categories: GoalCategory[]) {
  if (categories.length === 0) {
    return DEFAULT_GOAL_CATEGORIES;
  }

  return [...categories].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.key.localeCompare(right.key);
  });
}

function buildLookup(categories: GoalCategory[]) {
  return new Map(categories.map((category) => [category.key, category]));
}

export function getCategorySelectionFromValue(category: string): {
  selection: CategorySelection;
  customValue: string;
};
export function getCategorySelectionFromValue(
  category: string,
  categories: GoalCategory[],
  categoryKey?: string | null
): {
  selection: CategorySelection;
  customValue: string;
};
export function getCategorySelectionFromValue(
  category: string,
  categories: GoalCategory[] = DEFAULT_GOAL_CATEGORIES,
  categoryKey?: string | null
): {
  selection: CategorySelection;
  customValue: string;
} {
  const normalizedCatalog = normalizeCategoryCatalog(categories);
  const categoryLookup = buildLookup(normalizedCatalog);
  const trimmedCategory = category.trim();
  const normalized = trimmedCategory.toLowerCase();

  if (categoryKey) {
    const keyed = categoryLookup.get(categoryKey.trim());
    if (keyed && isCategoryPresetId(keyed.key) && keyed.key !== "other") {
      return { selection: keyed.key, customValue: "" };
    }
    if ((keyed && keyed.key === "other") || categoryKey.trim().toLowerCase() === "other") {
      if (!GENERIC_OTHER_LABELS.has(normalized) && normalized.length > 0) {
        return { selection: CATEGORY_CUSTOM_VALUE, customValue: trimmedCategory };
      }
      return {
        selection: "other",
        customValue: "",
      };
    }
  }

  const resolved = resolveCategoryKey(category, normalizedCatalog);
  if (resolved !== "other" && isCategoryPresetId(resolved)) {
    return {
      selection: resolved,
      customValue: "",
    };
  }

  if (normalized.length > 0 && !GENERIC_OTHER_LABELS.has(normalized)) {
    return {
      selection: CATEGORY_CUSTOM_VALUE,
      customValue: trimmedCategory,
    };
  }

  return {
    selection: "other",
    customValue: "",
  };
}

export function getCategoryKeyForSelection(selection: CategorySelection): string {
  if (!selection || selection === CATEGORY_CUSTOM_VALUE) {
    return "other";
  }
  return selection;
}

export function getCategoryLabel(
  selection: CategorySelection,
  customValue?: string,
  categories: GoalCategory[] = DEFAULT_GOAL_CATEGORIES
): string {
  const normalizedCatalog = normalizeCategoryCatalog(categories);
  const categoryLookup = buildLookup(normalizedCatalog);

  if (selection === CATEGORY_CUSTOM_VALUE) {
    const custom = customValue?.trim();
    return custom && custom.length > 0 ? custom : "Other";
  }

  return categoryLookup.get(selection)?.label ?? "Other";
}

export function resolveCategoryKey(
  labelOrKey: string,
  categories: GoalCategory[] = DEFAULT_GOAL_CATEGORIES
): string {
  const normalizedCatalog = normalizeCategoryCatalog(categories);
  const normalizedInput = labelOrKey.trim().toLowerCase();
  if (normalizedInput.length === 0) {
    return "other";
  }

  for (const category of normalizedCatalog) {
    if (normalizedInput === category.key.toLowerCase()) {
      return category.key;
    }
    if (normalizedInput === category.label.toLowerCase()) {
      return category.key;
    }
    if (category.aliases.some((alias) => alias.toLowerCase() === normalizedInput)) {
      return category.key;
    }
  }

  return "other";
}

const CUSTOM_CATEGORY_FILTER_PREFIX = "custom:";

/**
 * A goal's Category filter value: its default category's key, or one value per
 * custom label (custom goals store `category_key = "other"` with the label in `category`).
 */
export function categoryFilterValue(category: string, categoryKey?: string | null): string {
  const key = resolveCategoryKey(
    categoryKey && categoryKey !== "other" ? categoryKey : category
  );
  if (key !== "other") {
    return key;
  }
  const label = category.trim().toLowerCase();
  return label.length > 0 && !GENERIC_OTHER_LABELS.has(label)
    ? `${CUSTOM_CATEGORY_FILTER_PREFIX}${label}`
    : "other";
}

/** Every default category, then each custom label the goals use. */
export function buildCategoryFilterOptions(
  goals: ReadonlyArray<{ category: string; category_key?: string | null }>
): Array<{ value: string; label: string }> {
  const customLabels = new Map<string, string>();
  for (const goal of goals) {
    const value = categoryFilterValue(goal.category, goal.category_key);
    if (value.startsWith(CUSTOM_CATEGORY_FILTER_PREFIX) && !customLabels.has(value)) {
      customLabels.set(value, goal.category.trim());
    }
  }
  const custom = Array.from(customLabels, ([value, label]) => ({ value, label })).sort(
    (left, right) => left.label.localeCompare(right.label)
  );
  return [
    ...normalizeCategoryCatalog(DEFAULT_GOAL_CATEGORIES).map((category) => ({
      value: category.key,
      label: category.label,
    })),
    ...custom,
  ];
}

export function getCategoryValueForWrite(
  selection: CategorySelection,
  customValue?: string,
  categories: GoalCategory[] = DEFAULT_GOAL_CATEGORIES
): {
  category: string;
  categoryKey: string;
} {
  const categoryLabel = getCategoryLabel(selection, customValue, categories);
  if (selection === CATEGORY_CUSTOM_VALUE) {
    return {
      category: categoryLabel,
      categoryKey: "other",
    };
  }

  return {
    category: categoryLabel,
    categoryKey: selection || "other",
  };
}

export function getGoalCategoryLabel(
  category: string,
  categoryKey: string | null | undefined,
  categories: GoalCategory[] = DEFAULT_GOAL_CATEGORIES
) {
  const normalizedCatalog = normalizeCategoryCatalog(categories);
  const categoryLookup = buildLookup(normalizedCatalog);
  const key = categoryKey?.trim();
  if (key && key !== "other") {
    const fromCatalog = categoryLookup.get(key);
    if (fromCatalog) {
      return fromCatalog.label;
    }
  }
  return category;
}

/** A preset category's badge in its palette surface and ink; custom categories stay neutral. */
export function getCategoryBadgeStyle(
  categoryKeyOrLabel: string
): { backgroundColor: string; color: string; borderColor: string } | undefined {
  const key = resolveCategoryKey(categoryKeyOrLabel);
  if (key === "other") {
    return undefined;
  }
  const { surface, ink } = goalCategoryPair(key);
  return { backgroundColor: surface, color: ink, borderColor: "transparent" };
}

export function getCategorySwatchColor(
  selection: CategorySelection,
  categories: GoalCategory[] = DEFAULT_GOAL_CATEGORIES
): string {
  if (selection === CATEGORY_CUSTOM_VALUE) {
    return "#64748b";
  }

  const normalizedCatalog = normalizeCategoryCatalog(categories);
  const categoryLookup = buildLookup(normalizedCatalog);
  return categoryLookup.get(selection)?.color ?? "#64748b";
}

export async function fetchGoalCategories(
  supabase: Pick<SupabaseClient<Database>, "from">
): Promise<GoalCategory[]> {
  const { data, error } = await supabase
    .from("goal_categories")
    .select("key, label, aliases, color, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return DEFAULT_GOAL_CATEGORIES;
  }

  return normalizeCategoryCatalog(
    data.map((row) => ({
      key: row.key,
      label: row.label,
      aliases: row.aliases ?? [],
      color: row.color ?? "#64748b",
      sortOrder: row.sort_order,
    }))
  );
}
