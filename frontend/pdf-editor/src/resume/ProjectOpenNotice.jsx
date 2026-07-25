import { useEffect, useId, useRef } from "react";

const announcedNotices = new WeakSet();

export default function ProjectOpenNotice({
  notice,
  onOpenAnother,
  onDismiss,
  returnFocusRef,
  className = "",
}) {
  const alertRef = useRef(null);
  const baseId = useId();
  const recovery = notice?.type === "error" ? notice.recovery : null;

  useEffect(() => {
    if (!recovery || announcedNotices.has(notice)) return;
    announcedNotices.add(notice);
    alertRef.current?.focus();
  }, [notice, recovery]);

  if (!notice) return null;
  if (notice.type !== "error") {
    return (
      <div role="status" className={`border border-emerald-900/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300 ${className}`}>
        {notice.text}
      </div>
    );
  }

  if (!recovery) {
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center justify-between gap-3 border border-red-900/60 bg-red-950/60 px-4 py-3 text-sm text-red-300 ${className}`}
      >
        <span>{notice.text || "The requested local action could not be completed."}</span>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="rounded-lg border border-red-800 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-900/60">
            Dismiss
          </button>
        )}
      </div>
    );
  }

  const dismiss = () => {
    onDismiss();
    window.requestAnimationFrame(() => returnFocusRef?.current?.focus());
  };
  return (
    <section
      ref={alertRef}
      role="alert"
      tabIndex={-1}
      aria-labelledby={`${baseId}-title`}
      aria-describedby={`${baseId}-message ${baseId}-guidance ${baseId}-assurance`}
      className={`border border-red-900/60 bg-red-950/60 px-4 py-4 text-red-200 outline-none focus:ring-2 focus:ring-red-500/60 ${className}`}
    >
      <h2 id={`${baseId}-title`} className="text-sm font-semibold">{recovery.title}</h2>
      <p id={`${baseId}-message`} className="mt-1 text-sm text-red-200/90">{recovery.message}</p>
      <p id={`${baseId}-guidance`} className="mt-2 text-xs leading-5 text-red-200/75">{recovery.guidance}</p>
      <p id={`${baseId}-assurance`} className="mt-2 text-xs font-medium text-emerald-300">{recovery.assurance}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onOpenAnother} className="rounded-lg bg-red-200 px-3 py-2 text-xs font-semibold text-red-950 hover:bg-white">
          Open another project
        </button>
        <button type="button" onClick={dismiss} className="rounded-lg border border-red-800 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-900/60">
          Continue with current workspace
        </button>
      </div>
    </section>
  );
}
