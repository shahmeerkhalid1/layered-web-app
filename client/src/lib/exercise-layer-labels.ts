/** 0-based index. Layers are numbered sequentially; finisher is explicit on the layer row. */
export function getLayerStepTitle(index: number): string {
  return `Layer ${index + 1}`;
}
