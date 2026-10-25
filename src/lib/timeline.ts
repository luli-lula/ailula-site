// Height on the redwood is time: roots are 2017, the canopy is now.
export const TIMELINE = { startYear: 2017, endYear: 2026, maxHeight: 115 } as const;

const span = TIMELINE.endYear - TIMELINE.startYear;

export function yearToHeight(year: number): number {
  const h = ((year - TIMELINE.startYear) / span) * TIMELINE.maxHeight;
  return Math.min(TIMELINE.maxHeight, Math.max(0, h));
}

export function heightToYear(h: number): number {
  return TIMELINE.startYear + (h / TIMELINE.maxHeight) * span;
}
