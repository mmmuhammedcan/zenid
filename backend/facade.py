import base64
from dataclasses import dataclass

from modules.cv_builder import CVDataException, generate_cv_pdf
from modules.ocr_engine import OCRUnavailableException, to_searchable_pdf
from modules.overlay import OverlayException, OverlayItem
from modules.overlay import apply_overlay as _apply_overlay
from modules.overlay import get_page_sizes, render_pages
from modules.scanner import ImageQualityException, correct_perspective, to_pdf


@dataclass
class Result:
    success: bool
    data: bytes | None = None
    error: str | None = None
    pages: list[dict] | None = None


class DocFacade:
    def scan_to_pdf(self, image_bytes: bytes) -> Result:
        try:
            # Not: burada bilinçli olarak apply_scan_effect (gri tonlama + CLAHE)
            # UYGULAMIYORUZ — kullanıcı görselin orijinaliyle %100 aynı kalmasını,
            # sadece üzerine görünmez/aranabilir metin katmanı eklenmesini istedi.
            #
            # reconstruct_text_pdf (kelimeleri vektör metin olarak yeniden dizme)
            # denendi ama yoğun/gerçek belgelerde Tesseract'ın satır segmentasyon
            # hataları yüzünden üst üste binen, devasa/garip boyutlu metin
            # üretebiliyor — güvenilir değil, kullanılmıyor. Görsel + görünmez
            # metin katmanı yöntemi hiçbir zaman kaynaktan daha kötü olamaz.
            corrected = correct_perspective(image_bytes)

            try:
                pdf_bytes = to_searchable_pdf(corrected)
            except OCRUnavailableException:
                # OCR başarısız/kurulu değil — görsel PDF'i yine de ver, metin
                # katmanı olmadan
                pdf_bytes = to_pdf(corrected)

            return Result(success=True, data=pdf_bytes)
        except ImageQualityException as e:
            return Result(success=False, error=str(e))

    def render_pdf_pages(self, pdf_bytes: bytes) -> Result:
        try:
            sizes = get_page_sizes(pdf_bytes)
            images = render_pages(pdf_bytes)
            pages = [
                {
                    "image_base64": base64.b64encode(img).decode("ascii"),
                    "width": w,
                    "height": h,
                }
                for img, (w, h) in zip(images, sizes)
            ]
            return Result(success=True, pages=pages)
        except OverlayException as e:
            return Result(success=False, error=str(e))

    def apply_overlay(self, pdf_bytes: bytes, items: list[OverlayItem]) -> Result:
        try:
            edited = _apply_overlay(pdf_bytes, items)
            return Result(success=True, data=edited)
        except OverlayException as e:
            return Result(success=False, error=str(e))

    def generate_cv(self, data: dict) -> Result:
        try:
            pdf_bytes = generate_cv_pdf(data)
            return Result(success=True, data=pdf_bytes)
        except CVDataException as e:
            return Result(success=False, error=str(e))
