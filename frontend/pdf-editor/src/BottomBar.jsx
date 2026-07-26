import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useI18n } from "./I18nContext.jsx";

export default function BottomBar({
  currentPage,
  numPages,
  onPrevPage,
  onNextPage,
  zoom,
  onZoomOut,
  onZoomIn,
  navigationDisabled = false,
}) {
  const { t } = useI18n();
  const iconButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-neutral-900/80 px-4 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrevPage} disabled={navigationDisabled || currentPage <= 1} title={t("Previous page")} aria-label={t("Previous page")} className={iconButtonClass}>
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[92px] text-center text-sm text-neutral-300">
          {t("Page")} {currentPage} {t("of")} {numPages}
        </span>
        <button type="button" onClick={onNextPage} disabled={navigationDisabled || currentPage >= numPages} title={t("Next page")} aria-label={t("Next page")} className={iconButtonClass}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="h-6 w-px bg-white/10" />

      <div className="flex items-center gap-1">
        <button type="button" onClick={onZoomOut} disabled={zoom <= 25} title={t("Zoom out")} aria-label={t("Zoom out")} className={iconButtonClass}>
          <Minus size={16} />
        </button>
        <span className="min-w-[48px] text-center text-sm text-neutral-300">{zoom}%</span>
        <button type="button" onClick={onZoomIn} disabled={zoom >= 400} title={t("Zoom in")} aria-label={t("Zoom in")} className={iconButtonClass}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
