import cv2
import numpy as np
import img2pdf


class ImageQualityException(Exception):
    pass


def _order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left
    return rect


def _four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    rect = _order_points(pts)
    (tl, tr, br, bl) = rect

    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b))

    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b))

    dst = np.array(
        [[0, 0], [max_width - 1, 0], [max_width - 1, max_height - 1], [0, max_height - 1]],
        dtype="float32",
    )
    matrix = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def _auto_canny(image: np.ndarray, sigma: float = 0.33) -> np.ndarray:
    median = float(np.median(image))
    lower = int(max(0, (1.0 - sigma) * median))
    upper = int(min(255, (1.0 + sigma) * median))
    return cv2.Canny(image, lower, upper)


def _find_document_contour(edged: np.ndarray, image_area: float) -> np.ndarray | None:
    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    candidates = [c for c in contours if cv2.contourArea(c) > 0.15 * image_area]
    if not candidates:
        return None

    for contour in candidates:
        perimeter = cv2.arcLength(contour, True)
        # Birden çok epsilon dene — tek bir katsayı her fotoğrafta çalışmıyor
        for coeff in (0.01, 0.02, 0.03, 0.04, 0.05):
            approx = cv2.approxPolyDP(contour, coeff * perimeter, True)
            if len(approx) == 4:
                return approx.reshape(4, 2).astype("float32")

    # Net 4 köşe bulunamadı ama belirgin bir belge alanı var — en iyi tahmin olarak
    # en büyük konturun döndürülmüş sınırlayıcı dikdörtgenini kullan (spiral defter,
    # üzerinde nesne olan belge gibi düzensiz kenarlarda daha toleranslı)
    box = cv2.minAreaRect(candidates[0])
    return cv2.boxPoints(box).astype("float32")


def correct_perspective(image_bytes: bytes) -> np.ndarray:
    file_bytes = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if image is None:
        raise ImageQualityException("Görüntü okunamadı, dosya bozuk olabilir")

    orig = image.copy()
    ratio = image.shape[0] / 500.0
    resized = cv2.resize(image, (int(image.shape[1] / ratio), 500))

    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    # Bilateral filter: kenarları korurken doku (masa deseni vb.) gürültüsünü bastırır
    smoothed = cv2.bilateralFilter(gray, 9, 75, 75)
    edged = _auto_canny(smoothed)
    edged = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    edged = cv2.dilate(edged, None, iterations=1)

    contour = _find_document_contour(edged, resized.shape[0] * resized.shape[1])
    if contour is None:
        # Belge alanı ayırt edilemedi (örn. kağıt kareyi tamamen dolduruyor, arka
        # plan yok) — düzeltme yapmadan devam et, kullanıcıyı bloklamak yerine
        # elimizdeki en iyi görüntüyü ver
        return orig

    return _four_point_transform(orig, contour * ratio)


def apply_scan_effect(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Sert binarization yerine yumuşak kontrast iyileştirme — metin bulanıklaşmaz
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def to_pdf(image: np.ndarray) -> bytes:
    success, buffer = cv2.imencode(".png", image)
    if not success:
        raise ImageQualityException("PDF için görüntü kodlanamadı")
    return img2pdf.convert(buffer.tobytes())


def scan_to_pdf(image_bytes: bytes) -> bytes:
    corrected = correct_perspective(image_bytes)
    scanned = apply_scan_effect(corrected)
    return to_pdf(scanned)
