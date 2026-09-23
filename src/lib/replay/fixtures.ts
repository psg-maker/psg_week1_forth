import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReplayFixture } from "@/lib/shared/types";

export const FIXTURE_FILES = {
  "T04-NORMAL-D1-A": "normal-d1-a.json",
  "T04-NORMAL-D1-B": "normal-d1-b.json",
  "T04-NORMAL-D2": "normal-d2.json",
  "T04-TIMEOUT": "timeout.json",
  "T04-AUTH-401": "auth-401.json",
  "T04-RATE-429": "rate-429.json",
  "T04-OFFLINE": "offline.json",
  "T04-SCHEMA-BREAK": "schema-break.json",
  "T04-RECOVER-D2": "recover-d2.json",
} as const;

export type FixtureId = keyof typeof FIXTURE_FILES;

export async function loadFixture(fixtureId: string): Promise<ReplayFixture> {
  if (!(fixtureId in FIXTURE_FILES)) {
    throw new Error(`Unknown fixture: ${fixtureId}`);
  }

  const fileName = FIXTURE_FILES[fixtureId as FixtureId];
  const filePath = path.join(process.cwd(), "assignment", "fixtures", fileName);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ReplayFixture;
}
