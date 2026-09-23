import type { Comparison } from "@/lib/shared/types";

type ComparableRow = {
  signal_id: string;
  record_date: string;
  normalized_value: number;
  unit: string;
};

export function comparisonFor(rows: ComparableRow[], current: ComparableRow): Comparison {
  const previous = rows
    .filter((row) => row.signal_id === current.signal_id && row.record_date < current.record_date)
    .sort((left, right) => right.record_date.localeCompare(left.record_date))[0];

  if (!previous) {
    return { state: "insufficient", direction: null, magnitude: null, unit: null };
  }

  if (previous.unit !== current.unit) {
    return { state: "unit_mismatch", direction: null, magnitude: null, unit: null };
  }

  const signed = current.normalized_value - previous.normalized_value;
  return {
    state: "comparable",
    direction: signed > 0 ? "increase" : signed < 0 ? "decrease" : "unchanged",
    magnitude: Math.abs(signed),
    unit: current.unit,
  };
}
