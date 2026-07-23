export async function restoreCanvasSnapshot(canvas, snapshot, lifecycle = {}) {
  if (!canvas || !snapshot) return null;

  lifecycle.onBeforeLoad?.();
  try {
    await canvas.loadFromJSON(snapshot);
    canvas.renderAll();
    return canvas.toJSON();
  } finally {
    lifecycle.onAfterLoad?.();
  }
}
