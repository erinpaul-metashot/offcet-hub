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
  // Legacy / Process
  textileWaste: "/cirka_textile_waste.png",
  sewingMachine: "/cirka_sewing_machine.png",
  patternMaker: "/cirka_pattern_maker.png",
  shoppingBags: "/cirka_shopping_bags.png",
  groupSelfie: "/cirka_group_selfie.png",

  // Context-specific Material Batches
  jerseyOffcuts: "/cirka_batch_jersey_offcuts.png",
  denimRolls: "/cirka_batch_denim_rolls.png",
  merinoKnit: "/cirka_batch_merino_knit.png",
  cottonTwill: "/cirka_batch_cotton_twill.png",
  flaxLinen: "/cirka_batch_flax_linen.png",
  canvasWebbing: "/cirka_batch_canvas_webbing.png",
  fleeceTrimmings: "/cirka_batch_fleece_trimmings.png",
  meltonWool: "/cirka_batch_melton_wool.png",
  linenDrapery: "/cirka_batch_linen_drapery.png",
  woolFelt: "/cirka_batch_wool_felt.png",
  viscoseLining: "/cirka_batch_viscose_lining.png",
  ribTrims: "/cirka_batch_rib_trims.png",
  jerseyRolls: "/cirka_batch_jersey_rolls.png",
} as const;
