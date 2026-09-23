import { NextResponse } from "next/server";
import { getReplayState, saveReplayState } from "@/lib/db/repository";
import { fixtureMatchesExpected, runFixture } from "@/lib/replay/engine";
import { loadFixture } from "@/lib/replay/fixtures";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ fixtureId: string }> },
) {
  try {
    const { fixtureId } = await context.params;
    const fixture = await loadFixture(fixtureId);
    const currentState = await getReplayState();
    const nextState = runFixture(currentState, fixture);
    await saveReplayState(nextState);

    return NextResponse.json(
      {
        ok: true,
        fixture: {
          fixture_id: fixture.fixture_id,
          description_ko: fixture.description_ko,
          expected: fixture.expected,
        },
        checks: fixtureMatchesExpected(nextState, fixture),
        state: nextState,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/replay/[fixtureId] failed", error);
    const message = error instanceof Error ? error.message : "fixture 실행 실패";
    const status = message.startsWith("Unknown fixture") ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
