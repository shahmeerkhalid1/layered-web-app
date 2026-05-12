/** Hover descriptions for chain type options (values match seeded dropdown `value`). */
export const CHAIN_TYPE_TOOLTIPS: Record<string, string> = {
  "Open Chain":
    "The moving limb is free (e.g. arm or leg moving without being fixed)",
  "Closed Chain":
    "The limb is fixed against a surface (e.g. foot on carriage or hands on bar)",
  Both: "Combines open and closed chain within the same exercise",
  "Lower Chain Closed":
    "Lower body is fixed (e.g. feet grounded), upper body moves freely",
  "Upper Open":
    "Upper body is moving freely while lower body remains stable",
};

export function chainTypeTooltipForValue(value: string): string | undefined {
  return CHAIN_TYPE_TOOLTIPS[value];
}
