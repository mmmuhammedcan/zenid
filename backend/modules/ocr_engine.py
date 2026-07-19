import io
import statistics
from collections import defaultdict

import cv2
import numpy as np
import pytesseract
from PIL import Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

DEJAVU_SANS_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_NAME = "DejaVuSans"
_font_registered = False

MIN_CONFIDENCE = 40
MIN_CONFIDENT_WORDS = 3
PAGE_WIDTH = 595  # A4 genişliği (pt)


class OCRUnavailableException(Exception):
    pass


def _to_pil_image(image: np.ndarray) -> Image.Image:
    if image.ndim == 2:
        return Image.fromarray(image)
    return Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))


def _ensure_font_registered() -> None:
    global _font_registered
    if not _font_registered:
        pdfmetrics.registerFont(TTFont(FONT_NAME, DEJAVU_SANS_PATH))
        _font_registered = True


def to_searchable_pdf(image: np.ndarray, lang: str = "tur+eng") -> bytes:
    pil_image = _to_pil_image(image)
    try:
        return pytesseract.image_to_pdf_or_hocr(pil_image, lang=lang, extension="pdf")
    except pytesseract.TesseractNotFoundError as e:
        raise OCRUnavailableException("Tesseract kurulu değil") from e
    except pytesseract.TesseractError as e:
        raise OCRUnavailableException(str(e)) from e


def reconstruct_text_pdf(image: np.ndarray, lang: str = "tur+eng") -> bytes | None:
    """Görüntüyü tamamen bırakıp, tespit edilen kelimeleri gerçek (vektör) metin
    olarak orijinal konumlarına yakın şekilde yeniden dizer. Görüntü hiç PDF'e
    gömülmediği için hiçbir zoom seviyesinde bulanıklaşmaz. OCR güveni düşükse
    (ör. el yazısı) None döner — çağıran taraf görsel tabanlı yönteme düşmeli.
    """
    pil_image = _to_pil_image(image)

    try:
        data = pytesseract.image_to_data(
            pil_image, lang=lang, output_type=pytesseract.Output.DICT
        )
    except pytesseract.TesseractNotFoundError as e:
        raise OCRUnavailableException("Tesseract kurulu değil") from e
    except pytesseract.TesseractError as e:
        raise OCRUnavailableException(str(e)) from e

    lines: dict[tuple[int, int, int], list[dict]] = defaultdict(list)
    total_words = 0
    for i in range(len(data["text"])):
        if not data["text"][i].strip() or int(data["conf"][i]) < MIN_CONFIDENCE:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines[key].append(
            {
                "left": data["left"][i],
                "top": data["top"][i],
                "width": data["width"][i],
                "height": data["height"][i],
                "text": data["text"][i],
            }
        )
        total_words += 1

    if total_words < MIN_CONFIDENT_WORDS:
        return None

    _ensure_font_registered()

    img_w, img_h = pil_image.size
    page_width = PAGE_WIDTH
    page_height = page_width * (img_h / img_w)
    scale = page_width / img_w

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))

    for line_words in lines.values():
        # Satırdaki tüm kelimeler aynı font boyutu ve taban çizgisini paylaşsın —
        # kelime bazlı boyutlandırma düzensiz/parçalı bir görünüme yol açıyordu
        line_height = statistics.median(w["height"] for w in line_words)
        line_top = min(w["top"] for w in line_words)
        font_size = max(4, line_height * scale * 0.85)
        y = page_height - (line_top * scale) - font_size

        c.setFont(FONT_NAME, font_size)
        for w in line_words:
            x = w["left"] * scale
            c.drawString(x, y, w["text"])

    c.showPage()
    c.save()
    return buffer.getvalue()
