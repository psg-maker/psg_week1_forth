import { NextResponse } from "next/server";
import { getLiveBoardState } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getLiveBoardState();
    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    console.error("GET /api/live failed", error);
    return NextResponse.json(
      { error: "database_error", message: "저장된 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
