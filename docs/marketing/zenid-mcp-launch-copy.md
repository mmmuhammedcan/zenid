# ZenID MCP — Launch Copy Drafts

Working file for the npm/site announcement. Not a spec, not shipped
anywhere yet — draft copy for the creator to pick from, cut, and combine.

---

## 1. Attention-getters (pick one, 3 seconds to land)

The problem with most of these tools: they ask the reader to trust a
paragraph before they've earned a reason to read it. Lead with the
outcome or the fear, not the feature.

**A — the fear hook (privacy angle, strongest differentiator):**
> Every "AI resume tool" wants your career history on their server.
> This one doesn't have a server.

**B — the outcome hook (what changes for the reader):**
> Open Claude. Say "check my resume against this job." Get a real
> answer — not a paragraph of generic advice, a score, a diff, and a
> file you can actually save.

**C — the specificity hook (concrete + surprising):**
> Your resume just failed ATS parsing on a date format. You'll never
> see that in the preview. This will.

**D — the contrarian hook (against the grain of every other AI resume tool):**
> Every other AI resume tool reads your career, guesses, and
> sometimes invents things you never did. This one refuses to.

Recommendation: **A for privacy-first audiences** (HN, r/privacy,
technical Twitter), **B for job-seeker audiences** (LinkedIn, job
search subreddits, TikTok/shorts script). Use both — different channel,
different hook.

---

## 2. One-paragraph pitch (for a bio, a submission blurb, a video description)

> ZenID is a local resume and portfolio builder that never leaves your
> browser. `zenid-mcp` is its free companion: a Model Context Protocol
> server you run yourself, that lets Claude (or any MCP client) open
> your `.zenid` file, score it against real ATS-parsing rules, and
> tailor it to a job posting — in conversation, with your real
> experience, never inventing a fact you didn't tell it. No account.
> No server. `npx zenid-mcp` and you're talking to your own resume.

---

## 3. Landing-page / npm-README-teaser copy (longer, structured)

### Headline
**Your resume, reviewed by an AI that can't lie about it — because it
can't leave your machine.**

### Sub-headline
zenid-mcp connects your own AI agent to your own ZenID profile.
Locally. No account, no upload, no model key ZenID holds on your
behalf.

### The three beats

**1. It's actually private, provably.**
The server makes zero network requests — not "we don't log it," not
"trust our privacy policy." A test literally stubs every socket in the
process to throw, and the full session (open, edit, validate, export)
still passes. Your resume never leaves your machine unless *you* paste
it somewhere.

**2. It tells the difference between rewording and lying.**
Ask it to punch up a bullet point and it will. Ask it to change your
job title, your dates, or your employer and it refuses — out loud,
naming the tool you'd need to use instead, because that's not wording
anymore, that's a fact about your life. Every factual edit reports the
old value and the new value. Nothing changes silently.

**3. It gives you a real score, not vibes.**
`zenid_validate` runs seven mechanical checks straight from actual
documented ATS parsing failure modes — missing dates, inconsistent
date formats, missing contact fields — and returns a percentage with a
concrete fix for each gap. Same file, same score, every time. Then, in
conversation, it can go further: read your real experience, take the
job description you're targeting, and tell you honestly what's weak,
missing, or unsupported — using your own facts, never invented ones.

### The install (make this trivially copyable)

```json
{
  "mcpServers": {
    "zenid": { "command": "npx", "args": ["-y", "zenid-mcp"] }
  }
}
```

Paste that into Claude Desktop's config, restart, and say:
> "Open ~/Documents/my-resume.zenid and check it against this job
> posting: [paste]."

### Closing line
Free. Open source. MIT licensed. No waitlist, no signup — it's already
on npm.

---

## 4. Launch-post format (Hacker News / Reddit / X thread opener)

> Show HN: zenid-mcp — an MCP server that reads your resume, scores it
> against real ATS rules, and refuses to invent facts about your career
>
> I built a local-first resume builder (ZenID) and kept hitting the
> same wall every time someone asked an AI to "improve my resume": the
> AI either had no reliable way to read the file, or it happily
> rewrote a job title because it sounded better.
>
> zenid-mcp is a stdio MCP server, npm-published, that runs entirely on
> your machine. It has no model key and makes no network request
> (there's a test that proves it — every socket is stubbed to throw
> for the whole session). It draws a hard line between *wording*
> (which it can rewrite freely, with your original always recoverable)
> and *facts* (which need an explicit tool, and every change reports
> old-value/new-value).
>
> It also runs a deterministic ATS check — seven binary criteria
> grounded in documented parser failure modes (missing dates,
> inconsistent date formats, etc.), same file always gets the same
> score. What it deliberately does *not* do is claim to replicate a
> real ATS's keyword matching against a specific job posting — that's
> a live conversation with whichever agent you're using, using your
> real content, not a black-box number from a script with no model
> access.
>
> npm: `npx zenid-mcp` · repo: github.com/mmmuhammedcan/zenid · MIT.

---

## 5. Tone notes for whoever writes the video script next

- Open on the fear/pain, not the feature: someone's resume getting
  auto-rejected without ever knowing why, before naming the product.
- Show the refusal moment live — an agent trying to change an employer
  name and getting told no. That's the single most convincing 10
  seconds this product has; it's the opposite of every "AI resume
  writer will invent your job history" fear.
- Show the score going from a real, low number to a real, higher
  number, from a real edit — not a mockup. (The Elif walkthrough
  earlier in this session is a ready-made script: open file, run
  validate at 57%, add real facts, reword with the evidence formula,
  re-validate at 100%.)
- End on the install command on screen, held long enough to screenshot.
  One line. That's the entire "call to action."
