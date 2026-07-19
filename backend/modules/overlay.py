import base64
from dataclasses import dataclass
from typing import Literal

import fitz  # PyMuPDF


class OverlayException(Exception):
    pass


@dataclass
class OverlayItem:
    page: int
    x: float
    y: float
    kind: Literal["text", "image"]
    content: str  # kind="text" -> düz metin, kind="image" -> base64 PNG (data URL veya ham base64)
    font_size: float = 14
    width: float | None = None  # kind="image" için hedef genişlik (pt)
    height: float | None = None  # kind="image" için hedef yükseklik (pt)


def _open_pdf(pdf_bytes: bytes) -> fitz.Document:
    try:
        return fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise OverlayException("PDF açılamadı, dosya bozuk olabilir") from e


def get_page_sizes(pdf_bytes: bytes) -> list[tuple[float, float]]:
    doc = _open_pdf(pdf_bytes)
    try:
        return [(page.rect.width, page.rect.height) for page in doc]
    finally:
        doc.close()


def render_pages(pdf_bytes: bytes, zoom: float = 1.5) -> list[bytes]:
    doc = _open_pdf(pdf_bytes)
    try:
        matrix = fitz.Matrix(zoom, zoom)
        return [page.get_pixmap(matrix=matrix).tobytes("png") for page in doc]
    finally:
        doc.close()


def _decode_image(content: str) -> bytes:
    if content.startswith("data:"):
        content = content.split(",", 1)[1]
    return base64.b64decode(content)


def apply_overlay(pdf_bytes: bytes, items: list[OverlayItem]) -> bytes:
    doc = _open_pdf(pdf_bytes)
    try:
        for item in items:
            if item.page < 0 or item.page >= len(doc):
                raise OverlayException(f"Geçersiz sayfa numarası: {item.page}")
            page = doc[item.page]

            if item.kind == "text":
                page.insert_text(
                    (item.x, item.y),
                    item.content,
                    fontsize=item.font_size,
                    fontname="helv",
                )
            elif item.kind == "image":
                width = item.width or 120
                height = item.height or 50
                rect = fitz.Rect(item.x, item.y, item.x + width, item.y + height)
                page.insert_image(rect, stream=_decode_image(item.content))
            else:
                raise OverlayException(f"Bilinmeyen overlay türü: {item.kind}")

        return doc.tobytes()
    finally:
        doc.close()
