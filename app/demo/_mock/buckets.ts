const DASHBOARD_BUCKETS = 6;

function toMonthBucketLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(timestamp);
}

/**
 * Mirrors the month bucketing used by the Convex dashboard queries: six
 * trailing months, labelled by short month name.
 */
export function buildMonthBuckets(values: number[]) {
  const now = new Date();
  const buckets = Array.from({ length: DASHBOARD_BUCKETS }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (DASHBOARD_BUCKETS - 1 - index), 1);

    return {
      label: toMonthBucketLabel(date.getTime()),
      month: date.getMonth(),
      year: date.getFullYear(),
      value: 0,
    };
  });

  for (const value of values) {
    const date = new Date(value);
    const bucket = buckets.find(
      (entry) => entry.month === date.getMonth() && entry.year === date.getFullYear(),
    );

    if (bucket) {
      bucket.value += 1;
    }
  }

  return buckets.map(({ label, value }) => ({ label, value }));
}
