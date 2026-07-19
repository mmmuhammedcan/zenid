import { Eraser as ClearIcon, ImagePlus, PenTool, Pencil, Redo2, Type, Undo2 } from "lucide-react";

export default function Toolbar({
  onAddText,
  onAddSignature,
  onAddImage,
  drawMode,
  onToggleDraw,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearPage,
}) {
  const creationItems = [
    { key: "text", label: "Add Text", Icon: Type, onClick: onAddText, active: false },
    { key: "signature", label: "Add Signature", Icon: PenTool, onClick: onAddSignature, active: false },
    { key: "image", label: "Add Image", Icon: ImagePlus, onClick: onAddImage, active: false },
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
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 ${
        active
          ? "bg-indigo-500 text-white"
          : danger
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : "text-neutral-300 hover:bg-neutral-800 hover:text-white active:bg-neutral-700"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );

  return (
    <div className="fixed left-6 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-2 shadow-2xl shadow-black/40 backdrop-blur">
      {creationItems.map(renderButton)}
      <div className="my-1 h-px bg-neutral-800" />
      {historyItems.map(renderButton)}
      <div className="my-1 h-px bg-neutral-800" />
      {renderButton({ key: "clear", label: "Clear page (Ctrl+Z to undo)", Icon: ClearIcon, onClick: onClearPage, danger: true })}
    </div>
  );
}
