import { SourceError } from "@/lib/live/coinbase";
import type { ErrorCode } from "@/lib/shared/types";

export function classifyLiveError(error: unknown): Exclude<ErrorCode, "none"> {
  if (error instanceof SourceError) return error.code;
  if (error instanceof TypeError) return "schema_error";
  return "schema_error";
}
