import { Eraser as ClearIcon, ImagePlus, ListChecks, PenTool, Pencil, Redo2, Type, Undo2 } from "lucide-react";
import { useI18n } from "./I18nContext.jsx";

export default function Toolbar({
  onAddText,
  onAddSignature,
  onAddImage,
  fillToolsOpen,
  onToggleFillTools,
  placementSource,
  drawMode,
  onToggleDraw,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearPage,
}) {
  const { t } = useI18n();
  const creationItems = [
    { key: "text", label: "Add Text", Icon: Type, onClick: onAddText, active: placementSource === "text" },
    { key: "signature", label: "Add Visual Signature", Icon: PenTool, onClick: onAddSignature, active: placementSource === "signature" },
    {
      key: "fill",
      label: "Quick Fill",
      Icon: ListChecks,
      onClick: onToggleFillTools,
      active: fillToolsOpen || ["mark", "date", "initials"].includes(placementSource),
    },
    { key: "image", label: "Add Image", Icon: ImagePlus, onClick: onAddImage, active: placementSource === "image" },
    { key: "draw", label: "Draw", Icon: Pencil, onClick: onToggleDraw, active: drawMode },
  ];

  const historyItems = [
    { key: "undo", label: "Undo (Ctrl+Z)", Icon: Undo2, onClick: onUndo, disabled: !canUndo },
    { key: "redo", label: "Redo (Ctrl+Shift+Z)", Icon: Redo2, onClick: onRedo, disabled: !canRedo },
  ];

  const renderButton = ({ key, label, Icon, onClick, active, disabled, danger }) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={t(label)}
      aria-label={t(label)}
      aria-pressed={active}
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 ${
        active
          ? "bg-amber-600 text-white"
          : danger
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : "text-neutral-300 hover:bg-neutral-800 hover:text-white active:bg-neutral-700"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );

  return (
    <div className="fixed bottom-20 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-row gap-1 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/90 p-2 shadow-2xl shadow-black/40 backdrop-blur md:bottom-auto md:left-6 md:top-1/2 md:max-w-none md:translate-x-0 md:-translate-y-1/2 md:flex-col md:overflow-visible">
      {creationItems.map(renderButton)}
      <div className="mx-1 h-11 w-px shrink-0 bg-neutral-800 md:mx-0 md:my-1 md:h-px md:w-auto" />
      {historyItems.map(renderButton)}
      <div className="mx-1 h-11 w-px shrink-0 bg-neutral-800 md:mx-0 md:my-1 md:h-px md:w-auto" />
      {renderButton({ key: "clear", label: "Clear page (Ctrl+Z to undo)", Icon: ClearIcon, onClick: onClearPage, danger: true })}
    </div>
  );
}
