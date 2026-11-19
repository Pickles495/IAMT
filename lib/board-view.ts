export type BoardView = {
  pan: { x: number; y: number };
  zoom: number;
  selected: string;
  reading: string;
  tutor: boolean;
};

export function parseBoardView(raw: string | null): BoardView | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (
      !v ||
      !Number.isFinite(v.pan?.x) ||
      !Number.isFinite(v.pan?.y) ||
      !Number.isFinite(v.zoom) ||
      v.zoom < 0.35 ||
      v.zoom > 2.5 ||
      typeof v.selected !== "string" ||
      typeof v.reading !== "string" ||
      typeof v.tutor !== "boolean"
    )
      return null;
    return {
      pan: { x: v.pan.x, y: v.pan.y },
      zoom: v.zoom,
      selected: v.selected,
      reading: v.reading,
      tutor: v.tutor,
    };
  } catch {
    return null;
  }
}
