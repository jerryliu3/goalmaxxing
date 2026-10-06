import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { defaultGoalFormState } from "@/features/today/goal-form-model";
import { getCategorySwatchColor } from "@/lib/goals/category";
import { BlankCardConcept } from "./blank-card-concept";
import { GoalCreationIndex } from "./goal-creation-index";
import { EXAMPLE_SENTENCES, filledDefaults, guessCategory, nextEmptyFact, parseGoalSentence } from "./model";
import { SayItConcept } from "./say-it-concept";
import { buildDraftSession } from "./use-draft-goal";

const TODAY = new Date(2026, 9, 6);

describe("guessCategory", () => {
  it.each([
    ["Run a 5k", "health"],
    ["Ship my portfolio site", "career"],
    ["Visit grandma on Sundays", "relationships"],
    ["Learn Spanish", "personal"],
    ["Something vague", "personal"],
  ])("guesses %s as %s", (title, category) => {
    expect(guessCategory(title)).toBe(category);
  });
});

describe("parseGoalSentence", () => {
  it("reads name, weekly rhythm, deadline and reward", () => {
    const { fields, read, rhythmRead } = parseGoalSentence(EXAMPLE_SENTENCES[0], defaultGoalFormState, TODAY);
    expect(fields).toMatchObject({
      title: "Run a half marathon",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "3",
      end_date: "2027-03-31",
      default_local_time: "",
      reward_text: "Buy a new bike",
      category_selection: "health",
      color: getCategorySwatchColor("health"),
    });
    expect(rhythmRead).toBe(true);
    expect(read).toEqual(["name", "reward", "cadence", "deadline", "category"]);
  });

  it("reads a daily rhythm, this year, a time and a treat", () => {
    const { fields } = parseGoalSentence(EXAMPLE_SENTENCES[1], defaultGoalFormState, TODAY);
    expect(fields).toMatchObject({
      title: "Read 12 books",
      recurrence_interval: "daily",
      target_count: "1",
      end_date: "2026-12-31",
      default_local_time: "21:00",
      reward_text: "A weekend away",
      category_selection: "personal",
    });
  });

  it("leaves the reward empty when the sentence names none", () => {
    const { fields, read } = parseGoalSentence(EXAMPLE_SENTENCES[2], defaultGoalFormState, TODAY);
    expect(fields).toMatchObject({
      title: "Call Mom",
      recurrence_interval: "weekly",
      target_count: "2",
      default_local_time: "19:00",
      reward_text: "",
      end_date: "",
      category_selection: "relationships",
    });
    expect(read).not.toContain("reward");
  });

  it("clamps per-period counts and reads milestone journeys", () => {
    expect(parseGoalSentence("Swim 9 times a week", defaultGoalFormState, TODAY).fields.target_count).toBe("6");
    const { fields } = parseGoalSentence("Write a novel in 5 chapters", defaultGoalFormState, TODAY);
    expect(fields).toMatchObject({ title: "Write a novel", frequency_type: "fixed_milestones", target_count: "5" });
    expect(fields.milestone_names).toHaveLength(5);
  });

  it("flags a missing rhythm, since it is the one locked choice", () => {
    const { fields, rhythmRead } = parseGoalSentence("Learn Spanish", defaultGoalFormState, TODAY);
    expect(fields.title).toBe("Learn Spanish");
    expect(rhythmRead).toBe(false);
  });
});

describe("blank card defaults and nudges", () => {
  it("fills a named card with a guessed category and gentle defaults", () => {
    const fields = filledDefaults({ ...defaultGoalFormState, title: "Run a 5k", end_date: "2027-01-01", difficulty: "hard" }, TODAY);
    expect(fields).toMatchObject({
      category_selection: "health",
      color: getCategorySwatchColor("health"),
      difficulty: "medium",
      start_date: "2026-10-06",
      end_date: "",
      default_local_time: "",
    });
  });

  it("points at the next empty optional fact, face first, skipping what was skipped", () => {
    expect(nextEmptyFact(defaultGoalFormState, new Set())).toBe("deadline");
    expect(nextEmptyFact(defaultGoalFormState, new Set(["deadline"]))).toBe("time");
    const filled = { ...defaultGoalFormState, end_date: "2027-01-01", default_local_time: "07:00", description: "For me" };
    expect(nextEmptyFact(filled, new Set())).toBe("reward");
    expect(nextEmptyFact({ ...filled, reward_text: "New shoes" }, new Set())).toBeNull();
  });

  it("marks facts changed against a blank goal, with no link and visibility editable", () => {
    const blank = buildDraftSession(defaultGoalFormState, () => {});
    expect(blank.changed.size).toBe(0);
    expect(blank.link).toBeNull();
    expect(blank.canChangeVisibility).toBe(true);
    const named = buildDraftSession({ ...defaultGoalFormState, title: "Run", reward_text: "Shoes" }, () => {});
    expect([...named.changed].sort()).toEqual(["name", "reward"]);
  });
});

describe("goal creation study", () => {
  it("lists the three concepts with links", () => {
    render(<GoalCreationIndex />);
    for (const [name, slug] of [
      ["Blank card", "blank-card"],
      ["Stamp by stamp", "stamp"],
      ["Say it", "say-it"],
    ]) {
      expect(screen.getByRole("link", { name: `Open ${name}` })).toHaveAttribute("href", `/ux/goal-creation/${slug}`);
    }
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What changes vs today" })).toBeInTheDocument();
  });

  it("names a blank card, then asks the locked rhythm on its own", async () => {
    const user = userEvent.setup();
    render(<BlankCardConcept />);
    await user.type(screen.getByRole("textbox", { name: "Goal name" }), "Run a 5k");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("heading", { name: "How will you show up?" })).toBeInTheDocument();
    expect(screen.getByText("You can’t change this later.")).toBeInTheDocument();
  });

  it("fills the card from an example sentence, reward included", async () => {
    const user = userEvent.setup();
    render(<SayItConcept />);
    await user.click(screen.getByRole("button", { name: EXAMPLE_SENTENCES[0] }));
    const read = screen.getByRole("list", { name: "What we read" });
    expect(read).toHaveTextContent("Buy a new bike · sealed");
    expect(screen.getByLabelText("Reward sealed until you finish")).toBeInTheDocument();
  });
});
