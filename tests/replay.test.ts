import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  initialReplayState,
  runFixture,
} from "../src/lib/replay/engine";
import type { ReplayFixture } from "../src/lib/shared/types";

function fixture(name: string): ReplayFixture {
  const filePath = path.join(process.cwd(), "assignment", "fixtures", name);
  return JSON.parse(readFileSync(filePath, "utf8")) as ReplayFixture;
}

describe("T04 deterministic replay", () => {
  test("D1-A creates one daily row with value 100", () => {
    const state = runFixture(initialReplayState(), fixture("normal-d1-a.json"));
    expect(state.status).toEqual({ freshness: "fresh", error_code: "none" });
    expect(state.daily_readings).toHaveLength(1);
    expect(state.current_reading?.normalized_value).toBe(100);
  });

  test("D1-B updates the same row instead of creating a duplicate", () => {
    const first = runFixture(initialReplayState(), fixture("normal-d1-a.json"));
    const firstId = first.daily_readings[0].record_id;
    const second = runFixture(first, fixture("normal-d1-b.json"));

    expect(second.daily_readings).toHaveLength(1);
    expect(second.daily_readings[0].record_id).toBe(firstId);
    expect(second.daily_readings[0].normalized_value).toBe(105);
  });

  test("D2 creates the second day and delta 15", () => {
    let state = initialReplayState();
    state = runFixture(state, fixture("normal-d1-a.json"));
    state = runFixture(state, fixture("normal-d1-b.json"));
    state = runFixture(state, fixture("normal-d2.json"));

    expect(state.daily_readings).toHaveLength(2);
    expect(state.current_reading?.normalized_value).toBe(120);
    expect(state.last_delta).toBe(15);
    expect(state.last_comparison).toMatchObject({
      state: "comparable",
      direction: "increase",
      magnitude: 15,
      unit: "pt",
    });
  });

  test.each([
    ["timeout.json", "timeout"],
    ["auth-401.json", "auth"],
    ["rate-429.json", "rate_limit"],
    ["offline.json", "offline"],
    ["schema-break.json", "schema_error"],
  ])("%s preserves last good value and marks stale/%s", (fileName, errorCode) => {
    let state = initialReplayState();
    state = runFixture(state, fixture("normal-d1-a.json"));
    state = runFixture(state, fixture("normal-d1-b.json"));
    state = runFixture(state, fixture(fileName));

    expect(state.daily_readings).toHaveLength(1);
    expect(state.current_reading?.normalized_value).toBe(105);
    expect(state.status).toEqual({ freshness: "stale", error_code: errorCode });
  });

  test("recover after timeout returns fresh/none and adds exactly one next-day row", () => {
    let state = initialReplayState();
    state = runFixture(state, fixture("normal-d1-a.json"));
    state = runFixture(state, fixture("normal-d1-b.json"));
    state = runFixture(state, fixture("timeout.json"));
    state = runFixture(state, fixture("recover-d2.json"));

    expect(state.status).toEqual({ freshness: "fresh", error_code: "none" });
    expect(state.daily_readings).toHaveLength(2);
    expect(state.current_reading?.normalized_value).toBe(120);
    expect(state.last_delta).toBe(15);
  });
});
