export const DEFAULT_DOCUMENT_ZOOM = 100;
export const MIN_DOCUMENT_ZOOM = 25;

export function initialDocumentZoom({
  viewportWidth,
  documentWidth,
  horizontalPadding = 32,
  preserveDesktopAt = 1024,
}) {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(documentWidth) || documentWidth <= 0) {
    return DEFAULT_DOCUMENT_ZOOM;
  }

  if (viewportWidth >= preserveDesktopAt) {
    return DEFAULT_DOCUMENT_ZOOM;
  }

  const availableWidth = Math.max(0, viewportWidth - horizontalPadding);
  const fittedZoom = Math.floor((availableWidth / documentWidth) * 100);
  return Math.min(DEFAULT_DOCUMENT_ZOOM, Math.max(MIN_DOCUMENT_ZOOM, fittedZoom));
}
