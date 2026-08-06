const DAY = 24 * 60 * 60 * 1000;

/**
 * Anchored to today at 12:00 UTC so the demo always looks current while the
 * rendered date strings stay identical between server and browser.
 */
function anchorTimestamp() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12);
}

export const DEMO_NOW = anchorTimestamp();

export const daysAgo = (days: number) => DEMO_NOW - days * DAY;
export const daysAhead = (days: number) => DEMO_NOW + days * DAY;

/** Mid-month timestamp N months back: keeps trend buckets stable. */
export function monthsAgo(months: number) {
  const anchor = new Date(DEMO_NOW);
  return Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - months, 15, 12);
}

export const PHOTO = {
  textileWaste: "/cirka_textile_waste.png",
  sewingMachine: "/cirka_sewing_machine.png",
  patternMaker: "/cirka_pattern_maker.png",
  shoppingBags: "/cirka_shopping_bags.png",
} as const;
