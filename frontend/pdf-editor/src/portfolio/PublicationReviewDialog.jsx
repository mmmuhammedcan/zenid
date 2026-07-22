import { useEffect } from "react";
import { ContactRound, Download, FileArchive, LayoutTemplate, ShieldCheck, UserRound, X } from "lucide-react";

function ReviewGroup({ Icon, title, emptyMessage, children }) {
  return (
    <section className="rounded-xl border border-stone-800 bg-stone-900/45 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
        <Icon size={15} className="text-amber-500" /> {title}
      </div>
      {children || <p className="text-xs leading-5 text-stone-500">{emptyMessage}</p>}
    </section>
  );
}

export default function PublicationReviewDialog({ review, busy, onCancel, onPublish }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
      <section role="dialog" aria-modal="true" aria-labelledby="publication-review-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-800 bg-stone-950 text-stone-100 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-800 bg-stone-950/95 p-5 backdrop-blur sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400"><ShieldCheck size={15} /> Publication review</div>
            <h2 id="publication-review-title" className="text-xl font-semibold tracking-tight">Review everything that will become public</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">The ZIP is created entirely in this browser. It contains no private project JSON or unpublished items.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close publication review" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-900 hover:text-white disabled:opacity-30"><X size={17} /></button>
        </header>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          <ReviewGroup Icon={UserRound} title="Public identity" emptyMessage="Add your name and professional title before publishing.">
            {review.identity.length ? <ul className="space-y-1 text-xs text-stone-300">{review.identity.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          </ReviewGroup>
          <ReviewGroup Icon={LayoutTemplate} title="Visible sections" emptyMessage="No main sections are visible.">
            {review.sections.length ? <ol className="space-y-1 text-xs text-stone-300">{review.sections.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol> : null}
          </ReviewGroup>
          <ReviewGroup Icon={ContactRound} title="Public contact fields" emptyMessage="No contact details will be published.">
            {review.contacts.length ? <dl className="space-y-2 text-xs">{review.contacts.map(({ label, value }) => <div key={label}><dt className="text-stone-500">{label}</dt><dd className="break-all text-stone-300">{value}</dd></div>)}</dl> : null}
          </ReviewGroup>
          <ReviewGroup Icon={FileArchive} title="Files in the ZIP" emptyMessage="Only index.html will be included.">
            {review.files.length ? <ul className="space-y-1 text-xs text-stone-300">{review.files.map((item) => <li key={item}>• {item}</li>)}</ul> : null}
          </ReviewGroup>
        </div>

        <div className="mx-5 mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-5 text-emerald-200/80 sm:mx-6 sm:mb-6">
          Publishing includes {review.projectCount} project{review.projectCount === 1 ? "" : "s"} and {review.certificationCount} certificate{review.certificationCount === 1 ? "" : "s"}. Hidden profile items and the private <code>.zenid</code> project are excluded.
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-stone-800 bg-stone-950/95 p-5 backdrop-blur sm:flex-row sm:justify-end sm:p-6">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-stone-800 px-4 py-2.5 text-xs font-medium text-stone-300 hover:bg-stone-900 disabled:opacity-40">Keep editing</button>
          <button type="button" onClick={onPublish} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:cursor-wait disabled:opacity-60">
            <Download size={15} /> {busy ? "Creating locally…" : "Confirm and download ZIP"}
          </button>
        </footer>
      </section>
    </div>
  );
}
