# ZenID MCP — Launch Copy Drafts

Working file for the npm/site announcement. Not a spec, not shipped
anywhere yet — draft copy for the creator to pick from, cut, and combine.

Core angle, locked in: **this makes CV writing easy.** Not privacy,
not architecture, not "local-first" as a value statement. Privacy is
a real property of the system and gets one supporting line, not the
headline — nobody is going to stop scrolling for "no server." They
will stop scrolling for "my resume writes itself while I talk."

---

## 1. Attention-getters (pick one, 3 seconds to land)

**A — the effort hook (strongest, lead with this):**
> Stop staring at a blank resume. Just talk to it.

**B — the outcome hook:**
> Paste a job posting. Say "fix my resume for this." Watch the score
> go from 57 to 100 while you're still explaining what you actually did.

**C — the relief hook (against the pain of the old way):**
> You already told your friend the whole story of that job in two
> minutes. Tell your resume the same way — it writes the bullet points.

**D — the speed hook:**
> A finished, ATS-ready resume in one conversation. No template
> fighting, no formatting, no staring at a cursor.

Recommendation: **A or C as the opening line** everywhere — video,
landing page, npm README. Convenience is the whole sale. Everything
else (privacy, no invented facts, real scoring) is what makes people
trust it *after* they're already interested, not what gets them to
click.

---

## 2. One-paragraph pitch (bio / video description / submission blurb)

> Most people don't write resumes, they fight with them — a blank
> template, a cursor, an hour gone. zenid-mcp lets you just talk
> instead. Tell Claude what you did, in your own words, and it builds
> the resume: it writes strong bullet points from what you say, checks
> it against real ATS rules, and tells you exactly what's weak for the
> job you're applying to — all in one conversation. Runs on your own
> machine, free, `npx zenid-mcp` and you're done setting it up.

---

## 3. Landing-page / npm-README-teaser copy (longer, structured)

### Headline
**Talk your resume into existence.**

### Sub-headline
zenid-mcp connects Claude (or any AI you already use) straight to your
ZenID resume. Describe your experience, get a polished, ATS-checked
resume back — no blank page, no formatting, no second-guessing.

### The three beats (convenience first, trust second)

**1. You talk, it writes.**
No staring at a template. Tell it what you did on a project or a job
— the way you'd explain it to a friend — and it turns that into a
resume bullet that actually reads well, using the same
action-context-method-result structure real recruiters look for. Say
"make this punchier" or "shorten it" and it just does it.

**2. It checks your work before a robot rejects it.**
Most resumes get filtered before a human ever sees them. zenid-mcp
runs a real check — missing dates, inconsistent formatting, missing
contact info, the stuff that actually breaks ATS parsers — and hands
you a score and a fix list. Same file, same score, every time, so you
know exactly what to fix and why.

**3. It tailors to the actual job, on request.**
Paste the job posting. Ask "does this match?" It reads your real
experience and tells you honestly what's missing, what's buried, and
what to lead with — using only what you actually told it. It won't
invent a skill or a metric you never had; if the evidence isn't
there, it asks you a question instead of making something up.

*(Trust line, one sentence, not a section:)* Nothing leaves your
machine to do any of this — no account, no upload, no server holding
your resume.

### The install (make this trivially copyable)

```json
{
  "mcpServers": {
    "zenid": { "command": "npx", "args": ["-y", "zenid-mcp"] }
  }
}
```

Paste that into Claude Desktop's config, restart, and just start
talking:
> "I want to build a resume. I was a backend developer at a startup
> for two years, mostly working on their checkout system..."

### Closing line
Free. Open source. Already on npm — nothing to sign up for.

---

## 4. Launch-post format (Hacker News / Reddit / X thread opener)

> Show HN: zenid-mcp — talk your resume into existence with Claude
>
> I kept watching people freeze up in front of a blank resume
> template. The actual bottleneck was never "what template" — it was
> "how do I turn what I did into a sentence that sounds good and
> passes the robot filter."
>
> zenid-mcp is an MCP server (npm, free) that lets you just describe
> your experience conversationally and get back a resume: it writes
> the bullet points, checks the file against real ATS parsing rules
> (dates, formatting, contact fields — a deterministic score, not
> vibes), and can tailor it to a specific job posting on request,
> using only what you actually told it.
>
> It runs entirely on your machine — no account, no upload — which
> also happens to mean it can't quietly invent a job title or a metric
> you never had; changing a fact requires an explicit tool that
> reports the before/after, everything else is just wording it can
> rewrite freely.
>
> `npx zenid-mcp` · github.com/mmmuhammedcan/zenid · MIT.

---

## 5. Tone notes for the video script

- **Open on the blank-page pain, not a feature list.** Cold open:
  someone staring at an empty resume template, cursor blinking, timer
  ticking. That's the universal, instantly-recognized problem. Cut to
  them just *talking* instead.
- **Show the conversation doing the writing**, live: "I built five
  dashboards that cut reporting time..." → watch the polished bullet
  point appear. That's the core magic beat, give it the most screen
  time.
- **Show the score jump** (57 → 100) as a concrete, fast payoff —
  people respond to a number visibly going up more than to a
  paragraph of explanation.
- **The "it won't lie for you" moment** (agent tries to invent/change
  a fact, gets refused) goes *after* the writing demo, as the "and
  here's why you can trust what it wrote" beat — reassurance, not the
  hook.
- **End on the install command on screen**, held long enough to
  screenshot. One line. That's the entire call to action.
- Keep total runtime tight — this audience scrolls past anything that
  doesn't pay off in the first 3 seconds and doesn't finish anything
  over 60-90 seconds unless the hook was strong enough to earn it.
