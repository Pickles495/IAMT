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

type Point = { x: number; y: number };
type Camera = { pan: Point; zoom: number };

export function zoomBoardAt(
  camera: Camera,
  requested: number,
  anchor: Point,
): Camera {
  const zoom = Math.max(0.35, Math.min(2.5, requested));
  const ratio = zoom / camera.zoom;
  return {
    zoom,
    pan: {
      x: anchor.x - (anchor.x - camera.pan.x) * ratio,
      y: anchor.y - (anchor.y - camera.pan.y) * ratio,
    },
  };
}

export function fitBoardView(
  bounds: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
): Camera {
  const padding = 24;
  const zoom = Math.max(
    0.35,
    Math.min(
      1,
      (viewport.width - padding * 2) / Math.max(1, bounds.width),
      (viewport.height - padding * 2) / Math.max(1, bounds.height),
    ),
  );
  return {
    zoom,
    pan: {
      x: viewport.width / 2 - (bounds.x + bounds.width / 2) * zoom,
      y: viewport.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    },
  };
}
