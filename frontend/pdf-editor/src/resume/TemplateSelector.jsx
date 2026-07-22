import { useRef } from "react";
import { Check, FolderOpen } from "lucide-react";
import { ACCENT_THEMES } from "./themes";

const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    description: "A single column, generous whitespace, and quiet typography.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "An accent sidebar for contact details beside your story.",
  },
];

function MinimalPreview({ accentColor }) {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-stone-50 p-5">
      <div className="h-3 w-2/3 rounded-sm" style={{ backgroundColor: accentColor }} />
      <div className="h-2 w-1/3 rounded-sm bg-stone-300" />
      <div className="mt-3 h-px w-full bg-stone-200" />
      <div className="mt-2 h-1.5 w-full rounded-sm bg-stone-200" />
      <div className="h-1.5 w-5/6 rounded-sm bg-stone-200" />
      <div className="h-1.5 w-2/3 rounded-sm bg-stone-200" />
      <div className="mt-3 h-2 w-1/4 rounded-sm" style={{ backgroundColor: accentColor }} />
      <div className="mt-1 h-1.5 w-full rounded-sm bg-stone-200" />
      <div className="h-1.5 w-4/5 rounded-sm bg-stone-200" />
    </div>
  );
}

function ModernPreview({ accentColor }) {
  return (
    <div className="flex h-full w-full bg-stone-50">
      <div className="flex w-1/3 flex-col gap-2 p-4" style={{ backgroundColor: accentColor }}>
        <div className="h-3 w-3/4 rounded-sm bg-white/90" />
        <div className="mt-2 h-1.5 w-full rounded-sm bg-white/30" />
        <div className="h-1.5 w-2/3 rounded-sm bg-white/30" />
        <div className="mt-3 h-1.5 w-5/6 rounded-sm bg-white/30" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-2 w-1/3 rounded-sm bg-stone-400" />
        <div className="mt-1 h-1.5 w-full rounded-sm bg-stone-200" />
        <div className="h-1.5 w-5/6 rounded-sm bg-stone-200" />
        <div className="mt-3 h-2 w-1/4 rounded-sm bg-stone-400" />
        <div className="mt-1 h-1.5 w-full rounded-sm bg-stone-200" />
        <div className="h-1.5 w-2/3 rounded-sm bg-stone-200" />
      </div>
    </div>
  );
}

export default function TemplateSelector({
  selected,
  onSelect,
  onContinue,
  accentColor,
  onSelectAccent,
  onOpenProject,
  projectNotice,
}) {
  const projectInputRef = useRef(null);

  const handleProjectFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onOpenProject(file);
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-medium tracking-tight text-stone-100">Choose a starting point</h1>
        <p className="mt-2 text-stone-400">You can change the layout and color later without losing your content.</p>
        <input
          ref={projectInputRef}
          type="file"
          accept=".zenid,application/zip,application/json"
          onChange={handleProjectFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => projectInputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition-colors hover:border-amber-600 hover:bg-amber-600/10 hover:text-amber-400"
        >
          <FolderOpen size={16} /> Open ZenID Project
        </button>
        <p className="mt-2 text-xs text-stone-500">Opened locally in your browser—nothing is uploaded.</p>
      </div>

      {projectNotice && (
        <div
          role={projectNotice.type === "error" ? "alert" : "status"}
          className={`mb-6 w-full max-w-3xl rounded-lg border px-4 py-3 text-sm ${
            projectNotice.type === "error"
              ? "border-red-900/60 bg-red-950/60 text-red-300"
              : "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {projectNotice.text}
        </div>
      )}

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:shadow-md ${
                isSelected ? "border-amber-600 ring-2 ring-amber-600/30" : "border-stone-300"
              }`}
            >
              <div className="aspect-[3/4] w-full border-b border-stone-200 bg-stone-100">
                {tpl.id === "minimal" ? (
                  <MinimalPreview accentColor={accentColor} />
                ) : (
                  <ModernPreview accentColor={accentColor} />
                )}
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-stone-900">{tpl.name}</p>
                  <p className="mt-0.5 text-sm text-stone-600">{tpl.description}</p>
                </div>
                {isSelected && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white">
                    <Check size={14} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Accent color</p>
        <div className="flex items-center gap-3">
          {ACCENT_THEMES.map((theme) => {
            const isActive = accentColor === theme.hex;
            return (
              <button
                key={theme.id}
                type="button"
                title={theme.label}
                aria-label={theme.label}
                aria-pressed={isActive}
                onClick={() => onSelectAccent(theme.hex)}
                className={`h-8 w-8 rounded-full transition-all ${
                  isActive ? "ring-2 ring-offset-2 ring-offset-stone-950" : "hover:scale-110"
                }`}
                style={{ backgroundColor: theme.hex, ...(isActive ? { "--tw-ring-color": theme.hex } : {}) }}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={onContinue}
        className="mt-10 rounded-full bg-amber-600 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-500"
      >
        Continue
      </button>
    </div>
  );
}
