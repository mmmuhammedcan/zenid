import { useEffect, useRef, useState } from "react";
import { Check, ContactRound, Copy, Download, FileArchive, FolderGit2, LayoutTemplate, Sparkles, ShieldCheck, UserRound, X } from "lucide-react";
import { DEPLOYMENT_ASSISTANT_PROMPT } from "./deploymentAssistantPrompt.js";

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
  const [promptCopyState, setPromptCopyState] = useState("idle");
  const copyResetTimerRef = useRef(null);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (copyResetTimerRef.current) window.clearTimeout(copyResetTimerRef.current);
    };
  }, [busy, onCancel]);

  const copyDeploymentPrompt = async () => {
    try {
      await navigator.clipboard.writeText(DEPLOYMENT_ASSISTANT_PROMPT);
      setPromptCopyState("copied");
      copyResetTimerRef.current = window.setTimeout(() => setPromptCopyState("idle"), 2500);
    } catch {
      setPromptCopyState("failed");
    }
  };

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

        <section className="mx-5 mb-5 rounded-xl border border-stone-800 bg-stone-900/40 p-4 text-xs leading-5 text-stone-400 sm:mx-6 sm:mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-300">
            <FolderGit2 size={15} className="text-stone-400" /> Publishing this ZIP on GitHub Pages
          </div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Sign in to GitHub and create a new <strong>public</strong> repository. GitHub Free publishes Pages sites from public repositories.</li>
            <li>Extract this ZIP on your device. Upload its contents—not the ZIP file itself—using <strong>Add file → Upload files</strong>. Keep <code>index.html</code> at the repository root, then commit the upload.</li>
            <li>Open <strong>Settings → Pages</strong>. Under Source choose <strong>Deploy from a branch</strong>, select the repository&apos;s default branch and <strong>/(root)</strong>, then save.</li>
            <li>GitHub will show the public site address in Pages settings after deployment finishes.</li>
          </ol>
          <a
            href="https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-amber-400 hover:underline"
          >
            GitHub Pages documentation ↗
          </a>
        </section>

        <section className="mx-5 mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-stone-300 sm:mx-6 sm:mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
            <Sparkles size={15} /> Not sure where to start? Ask your AI assistant
          </div>
          <p className="text-stone-400">
            New to publishing a website? Copy this prompt and paste it into ChatGPT, Claude, Gemini, or
            any AI assistant you already use. It will help you pick between GitHub Pages, Netlify, and
            Cloudflare Pages, then walk you through publishing this ZIP step by step — adapted to
            whatever those sites currently look like, since their screens change more often than this
            page does.
          </p>
          <pre className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-800 bg-stone-950/70 p-3 text-[11px] leading-5 text-stone-400">
            {DEPLOYMENT_ASSISTANT_PROMPT}
          </pre>
          <button
            type="button"
            onClick={copyDeploymentPrompt}
            className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/15"
          >
            {promptCopyState === "copied" ? <Check size={14} /> : <Copy size={14} />} {promptCopyState === "copied" ? "Copied" : "Copy prompt for your AI assistant"}
          </button>
          <p role="status" className="mt-2 min-h-5 text-[11px] text-stone-400">
            {promptCopyState === "failed"
              ? "Clipboard access was blocked. Select the prompt above and copy it manually."
              : promptCopyState === "copied"
                ? "Prompt copied to your clipboard."
                : ""}
          </p>
        </section>

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
