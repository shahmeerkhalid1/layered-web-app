/** 0-based index. With 3+ layers, Finisher is always the last row; Layer 3+ sit before it. */
export function getLayerStepTitle(index: number, totalLayers: number): string {
  if (totalLayers >= 3 && index === totalLayers - 1) {
    return "Finisher";
  }
  return `Layer ${index + 1}`;
}

export function isFinisherLayerIndex(index: number, totalLayers: number): boolean {
  return totalLayers >= 3 && index === totalLayers - 1;
}
