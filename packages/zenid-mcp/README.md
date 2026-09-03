# zenid-mcp

A local [Model Context Protocol](https://modelcontextprotocol.io) server for
[ZenID](https://getzenid.com). It lets an agent client you already run — Claude
Desktop, Claude Code, or any other MCP client — read and edit your own `.zenid`
professional profile, on your own machine.

## The data boundary

This is the part worth reading before you install anything.

- The server runs on your computer, over stdio, started by your own client. It
  is not a hosted service.
- It makes no network request of any kind. That is enforced by a test which
  runs the server with every outbound socket stubbed to throw, and drives a
  full session through it.
- ZenID holds no model provider key and receives none of your data. Whatever
  your agent client sends to its model provider, it sends under that provider's
  terms, exactly as it would for any other file you show it.
- The server only touches paths you give it. It does not go looking for
  `.zenid` files.

## Install

Requires Node 20 or later.

```bash
npx zenid-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zenid": {
      "command": "npx",
      "args": ["-y", "zenid-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add zenid -- npx -y zenid-mcp
```

Then point it at a file you exported from ZenID:

> Open ~/Documents/my-profile.zenid and target my resume at this job posting.

Or start without an existing file:

> Create a new Turkish CV called Graduate CV. I will tell you my education,
> projects, skills, and experience one by one. Ask for missing details, do not
> invent anything, then save it as ~/Documents/graduate-cv.zenid and export a PDF.

## What it can and cannot do

The server draws a line between **how your history reads** and **what your
history says**.

Rewording a bullet on one resume variant is presentation. It is stored as an
override on that variant, and your canonical profile text is left exactly as
you wrote it, so you can always get back to it.

Adding or changing an employer name, an institution, a date, or a credential
identifier is a factual claim about your life. Dedicated tools add or edit it
and report exactly what was created or changed, so you can review every claim.
A wording tool asked to change a fact refuses and says which tool to use instead.
New entries are kept out of the public portfolio until you select them in ZenID.

Publication settings can be narrowed but never widened. The server cannot make
a contact field public, un-hide a section or an item you hid, attach media to
your public portfolio, or publish your resume. Deciding to make something
public is yours to do in ZenID.

Saving is explicit and, by default, writes a new file. Your opened file is
overwritten only if you ask for it directly.

## ATS-friendliness and writing help

`zenid_validate` reports mechanical findings straight from ZenID's own
[resume checklist](https://getzenid.com): a missing header location, no
professional link present, an entry with no start date, or dates written in
more than one format. It also computes an `atsScore`: a percentage over
seven binary, mechanical criteria (name, contact method, location,
professional link, filled experience and skills, dated entries, consistent
date format), with a concrete recommendation for each one that failed. The
same project scores the same way every time; it is arithmetic over the
findings above, not a judgment of your career.

Whether your resume would actually pass a real recruiter's screen for a
specific job is a different question, and this server does not answer it —
it holds no model-provider access to render that judgment (see "The data
boundary" above). That's a conversation to have directly with whichever
agent you're using: point it at `zenid_read_section` for your real content
and the job posting, and ask it to apply `zenid_resume_playbook`'s
`relevance_review` prompt.

`zenid_resume_playbook` returns the checklist's evidence formula, structure
rules, and four prompts for working with an AI editor honestly, as data your
agent can apply to your real, open project in conversation.

## Tools

| Tool | Purpose |
|---|---|
| `zenid_describe_format` | The project model and the rules above, as data |
| `zenid_create_project` | Start a valid empty workspace in memory |
| `zenid_open_project` | Open a `.zenid` file, return a structural summary |
| `zenid_read_section` | Read one section's items |
| `zenid_list_resumes` | List resume variants |
| `zenid_create_resume_variant` | Duplicate a variant for a target role |
| `zenid_set_item_selection` | Include or exclude an item from a variant |
| `zenid_set_wording` | Rewrite an item's wording (presentation only) |
| `zenid_reset_wording` | Restore your original wording |
| `zenid_add_fact` | Add a stated company, education, project, skill, or other profile entry |
| `zenid_edit_fact` | Change a factual field, with old and new reported |
| `zenid_set_portfolio_settings` | Narrow publication, edit portfolio copy |
| `zenid_validate` | Structural soundness, mechanical findings, and a deterministic atsScore |
| `zenid_resume_playbook` | The evidence formula, structure checklist, and four AI-collaboration prompts, for the agent to apply to your real content |
| `zenid_save_project` | Write a `.zenid` file |
| `zenid_export_resume_pdf` | Write an ATS-friendly resume PDF |
| `zenid_export_portfolio_zip` | Write the public portfolio package |

The opening summary returns counts and variant names, not your section prose,
so an agent improving one bullet does not have to pull your whole career into
its context first.

## Exports match the application

The PDF and portfolio ZIP are produced by the same functions the ZenID
application uses; this package supplies only the Node equivalents of what a
browser page would provide (font bytes, base64, and file I/O). A difference
between an application export and a server export is a defect, not a variation,
and a parity test in the main repository holds the two together.

## Development

```bash
npm install
npm test
```

The tests drive the real server over a real stdio transport in a subprocess,
with outbound sockets stubbed to throw.

## License

MIT
