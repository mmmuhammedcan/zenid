# ZenID Product Roadmap

Last updated: 25 July 2026

## Product Direction

ZenID is a privacy-first, local professional identity workspace. A user enters professional
information once, then uses it to create resumes and a portfolio website without creating an
account or leaving private data on ZenID servers.

```text
User-owned Professional Profile
        |
        +-- Resume Documents  -> ATS-friendly PDFs
        +-- Portfolio Config  -> Local preview and public static-site ZIP
        +-- ZenID Project     -> Private, editable backup opened by ZenID later
```

The central promise is:

> Enter your information once. Create your resume and portfolio. Keep the project on your own
> device. ZenID does not retain it.

The current frontend design should be preserved. The work below changes and stabilizes the data
and export foundations behind the interface; it does not require a visual rewrite.

ZenPDF is a supporting form fill-and-sign tool. The Python OCR/backend and vanilla HTML pages are
legacy experiments, not part of the current React product architecture or active delivery plan.
Expanding either area requires a recorded product decision.

## Delivery Status Language

Roadmap status is evidence-based:

- **[I] Implemented:** the code exists.
- **[A] Automatically verified:** repeatable automated evidence exists.
- **[M] Manually accepted:** a dated manual/user acceptance record exists.

No item is considered fully accepted until the evidence required by its spec is present. Current
evidence is summarized in `docs/verification-matrix.md`.

## Core Privacy Model

- Resume and portfolio editing happens in the browser.
- The basic product does not require an account.
- ZenID does not upload or retain the user's profile, resumes, portfolio configuration, or images.
- Browser storage may provide convenient autosave on the current device, but it is not the user's
  only backup.
- Users can save an editable ZenID project file and reopen it during a later ZenID session.
- Choosing a project file should be described as **Open ZenID Project**, not as uploading it. The
  file must be read locally in the browser.
- Any future AI or hosted service must be optional and clearly explain what data leaves the device.
- Private project backups and publicly deployable portfolio files must remain separate.

## User-Owned Files

### Private ZenID Project

The main portable project should use a custom `.zenid` extension and a documented ZIP-based
format. It contains the editable source data needed to restore the user's workspace.

```text
Muhammed_ZenID_Project.zenid
├── manifest.json
├── profile.json
├── resumes/
│   ├── general.json
│   └── backend-developer.json
├── portfolio/
│   └── configuration.json
├── assets/
│   ├── profile-photo.webp
│   ├── projects/
│   └── certificates/
└── generated/                 # optional convenience copies
    ├── General_Resume.pdf
    └── Backend_Resume.pdf
```

Generated PDFs may be included for convenience, but they are outputs rather than the editable
source of truth. The structured profile and document configurations are what allow ZenID to
rebuild and update a resume later.

### Public Portfolio ZIP

Portfolio export is a separate static-site package intended for deployment to a service chosen by
the user, such as GitHub Pages, Netlify, Cloudflare Pages, or the user's own server.

```text
portfolio.zip
├── index.html
├── projects/
├── assets/
└── resume.pdf                 # only when the user chooses to publish it
```

The public portfolio ZIP must contain only information the user explicitly selected for
publication. It must never contain the private `.zenid` project, unpublished resume variants,
private profile fields, or internal source JSON.

## Canonical Data Model

ZenID can continue to use one React application and one project state. The state should be
logically separated so facts about a person are not mixed with presentation decisions:

```js
{
  schemaVersion: 3,
  profile: {
    personalInfo: {},
    experience: [],
    education: [],
    projects: [],
    skills: [],
    achievements: [],
    certifications: []
  },
  resumes: [
    {
      id: "stable-uuid",
      name: "General Resume",
      template: "minimal",
      accentColor: "#475364",
      sectionOrder: [],
      selectedItems: {},
      contentOverrides: {}
    }
  ],
  portfolio: {
    template: "minimal",
    theme: "dark",
    visibleSections: {},
    contactPrivacy: {},
    caseStudies: []
  }
}
```

- `profile` contains reusable facts supplied by the user.
- `resumes` contains one or more resume versions and how each one presents selected profile facts.
- `portfolio` contains publication, privacy, theme, and portfolio-only content.
- Editing a shared fact can update both outputs.
- Changing a resume template must not change the portfolio.
- Hiding a phone number from the portfolio must not delete it from the private profile.

This is a separation of responsibilities inside one project, not a requirement for separate apps,
databases, or frontend designs.

## Compatibility Contract

The Resume Builder should reach a stable foundation so future work is primarily templates, visual
polish, and additive capabilities rather than repeated data-model rewrites.

- Every saved project has an explicit `schemaVersion`.
- Every format change includes a sequential migration, for example `v1 -> v2 -> v3`.
- A current ZenID release must import and migrate all previously released project formats that we
  have promised to users.
- Existing `zenid.resume-builder.draft.v1` browser drafts must be migrated into the first canonical
  project schema.
- Imports must never silently discard unknown or unsupported data.
- A project created by a newer unsupported ZenID version should be rejected safely with a useful
  explanation, not partially opened and overwritten.
- Imported files are opened as a working copy. The original user-owned file is never modified.
- Profile and document items use stable UUIDs rather than an in-memory incrementing counter.
- Migration fixtures and round-trip tests must be kept for every released schema version.
- Export followed by import must reproduce the same editable profile, resume documents, portfolio
  configuration, and asset references.

Backward compatibility means migrating old structured projects forward. It does not require
keeping every old UI implementation or renderer permanently.

## Language and Locale Direction

- The product interface and default resume labels remain English for the current release.
- Users must already be able to enter Unicode content, including Turkish names and resume text.
- Fonts, validation, sorting, and storage must not assume ASCII-only content.
- User-facing strings and default section labels should not be spread through the data model in a
  way that prevents later translation.
- Turkish interface labels, locale-aware dates, and Turkish resume section defaults can be added in
  a later localization phase without changing the stored professional facts.
- The chosen content language belongs to each resume or portfolio configuration, not to the user's
  permanent profile.

## Free Local Product

- Manual Resume Builder with selectable, ATS-friendly PDF export
- Resume Architecture Playbook/checklist
- Local browser autosave
- Private `.zenid` project save/open
- Multiple resume versions stored inside the user's project
- One polished responsive portfolio template
- Local portfolio preview
- Public static portfolio ZIP export
- Explicit contact and publication privacy controls
- No required account, cloud storage, or ZenID-hosted public URL

The free product should be genuinely useful on its own. Privacy and user ownership are product
features, not temporary limitations before adding a database.

## Optional Future Services

Capabilities involving ongoing cost can be considered later without weakening the local product:

- AI resume analysis and prioritized suggestions
- Job-description comparison and targeted resume variants
- Evidence-based bullet improvements without inventing facts
- AI-assisted About, summary, and project descriptions
- Optional encrypted cloud backup and device synchronization
- Optional hosted portfolio publishing and custom domains
- Analytics and version history

These services must be opt-in. ZenID must never use private user data for model training without
explicit consent. Hosted publishing, if introduced, is an additional service rather than a
requirement for creating or exporting a portfolio.

## Recommended Delivery Order

### Phase 1 — Stabilize the Resume Builder Foundation

Preserve the existing interface and complete the Resume Builder before expanding the product.

- Define the canonical versioned project schema.
- Move reusable facts into `profile` and resume-specific choices into `resumes[]`.
- Migrate the current localStorage draft format without losing existing user data.
- Replace incrementing item IDs with stable UUIDs.
- Support named resume versions within one project.
- Add real multi-page preview matching PDF page breaks.
- Resolve or clearly present the difference between the Modern preview and single-column ATS
  export.
- Add reset/clear-draft controls with confirmation.
- Strengthen PDF export validation, mobile behavior, accessibility, and regression coverage.
- Keep the current visual design unless a specific usability issue requires a change.

### Phase 2 — Portable ZenID Project Files

- Define and document `manifest.json` and `.zenid` package contents.
- Save and open `.zenid` project files entirely in the browser.
- Validate archive paths, file types, file sizes, JSON structure, and supported schema versions.
- Add sequential migration and round-trip fixtures for old project versions.
- Use IndexedDB for image/media autosave where localStorage is not suitable.
- Provide clear success, error, and newer-version compatibility messages.
- Verify through tests that opening a project causes no network upload.

### Phase 3 — Local Portfolio MVP

- Add the Portfolio Builder dashboard card and `/portfolio` routes.
- Reuse the canonical professional profile automatically.
- Build a five-step editor: Profile, Skills & Experience, Projects, Certificates, and Style &
  Privacy.
- Keep the editor and the real responsive public-page preview visible together on desktop, with a
  clear Edit/Preview switch on small screens.
- Ship one high-quality light/dark-capable template.
- Support About, skills, experience, projects, certificates, contact controls, and optional resume
  download.
- Treat the supplied CodeBasics screens as workflow references only: retain their understandable
  progress steps, item selection, template preview, hero, project, and certificate patterns without
  copying their branding, hosted-link model, fixed desktop navigation, or forced public contacts.
- Keep portfolio-only fields separate, including images, case studies, video links, and privacy.
- Generate the public static portfolio ZIP entirely in the browser.
- Show a publication review screen listing every contact field and file that will become public.

Portfolio MVP delivery slices:

1. [I] Add the route/dashboard entry, canonical portfolio defaults, five-step editor shell, local
   autosave, contact privacy controls, and a responsive live preview using existing profile facts.
2. [I] Add IndexedDB-backed profile, project, and certificate media and package those assets inside
   `.zenid` projects without storing large data URLs in localStorage.
3. [I] Add per-item publish controls, rich project case studies, per-screenshot captions and
   galleries, certificate details and images, introduction video, a single non-duplicated contact
   area, and locally generated or uploaded résumé download.
4. [I] Add configurable section ordering.
5. [I][A] Generate the static public portfolio ZIP and require a final publication/privacy review.
6. [I][A] Verify offline packaging and root/subpath static-host compatibility, including
   GitHub Pages-style deployment paths, with automated reference-integrity tests.

### Pre-Portfolio Gate — ZenPDF Fill & Sign Baseline

ZenPDF is a focused supporting tool for job, internship, university, and onboarding forms. It is
not intended to become a complete Acrobat replacement before the Portfolio Builder begins.

- [I] Keep document processing local in the browser.
- [I] Place text, signatures, initials, images, dates, checkmarks, crossmarks, and filled dots.
- [I] Use click-to-place behavior so form items start at the intended field rather than page center.
- [I][A] Preserve the original PDF, selectable source text, existing form data, and original page
  dimensions when exporting normal PDFs.
- [I] Detect existing interactive form fields and explain that Quick Fill can overlay them.
- [I] Warn before replacing a document containing unfinished annotations.
- [I] Make the core toolbar keyboard-labelled and usable in a narrow viewport.
- [I] Clearly describe drawn signatures as visual marks, not certificate-backed secure digital
  signatures.

Deferred until real usage proves they are needed:

- Direct AcroForm field editing with Tab/Shift+Tab navigation
- Automatic visual field detection for scanned flat forms
- Certificate-backed PAdES/güvenli elektronik imza
- Page thumbnails, reorder/delete/rotate, merge, and split
- Sending documents to other signers, audit trails, and collaboration
- Editable ZenPDF session packages and cross-device synchronization

### Phase 4 — Reliability and Localization

- Test `.zenid` projects produced by every previous released schema.
- Test portfolio ZIPs locally and on common static hosts.
- Add recovery guidance for corrupted or incomplete projects.
- Centralize user-facing strings and introduce locale-aware formatting.
- Add Turkish UI and Turkish resume defaults when English behavior is stable.
- Continue adding templates as presentation layers without changing canonical profile facts.

### Phase 5 — Optional User-Owned AI Compatibility

ZenID will not require or host an AI model, model-provider API key, AI proxy,
or ZenID account. A future ZenID plugin may instead teach the user's own
Claude, Codex, or another compatible AI how to read and safely edit a private
`.zenid` project:

```text
ZenID -> save .zenid -> user's AI edits it -> ZenID validates and reopens it
```

This can support job-description comparison, evidence-grounded resume
variants, ATS readability checks, and resume/portfolio consistency review.
ZenID does not send the project to the provider; the user chooses whether to
give the file to their AI, after which that provider's data terms apply.

Job listing, matching, fake-listing detection, and application automation are
not part of this local core. They may be considered later as a separate,
explicitly opt-in ZenID Jobs product with its own privacy and service boundary.

## Immediate Implementation Checklist

The next engineering work should be completed in this order:

1. [I][A] Write the canonical schema and compatibility rules as code-level validation.
2. [I][A] Add stable UUID generation and migrate the current resume state into `profile` plus
   `resumes[]`.
3. [I][A] Add migration tests using synthetic copies of the current localStorage v1 draft.
4. [I][A] Add Save ZenID Project and Open ZenID Project, read entirely in the browser.
5. [I][A] Use the documented ZIP-based `.zenid` format for the current Resume Builder data. Asset
   entries will be added when profile and portfolio media are introduced.
6. [I][A] Add multiple named resume presentation versions without duplicating the shared profile.
   [I][A] Per-version Experience and Project selection and targeted description overrides for
   those two item types are implemented; broader overrides remain deferred.
7. [I][A] Add an exact multi-page ATS PDF preview generated by the same code as the downloaded PDF,
   while preserving the existing visual design preview. Complete manual mobile and assistive-
   technology testing before release.
8. [I] Begin the Portfolio Builder. Remaining Resume Builder reliability work is tracked in the
   verification matrix rather than described as complete.

## Important Product Principles

- Preserve the existing frontend design while stabilizing the underlying model.
- Do not fabricate experience, metrics, technologies, or achievements.
- Keep ATS exports selectable, readable, and single-column unless clearly presented otherwise.
- Make privacy controls visible, especially for phone numbers, emails, resumes, and uploaded media.
- Never put private project data inside the public portfolio ZIP.
- Keep ZenID company letterhead out of all customer Resume Builder and ZenPDF controls. It is
  reserved only for documents issued by ZenID itself.
- Treat user-controlled backups as a first-class workflow, not an advanced setting.
- Prefer compatibility and data recovery over silently dropping fields.
- Quality is more important than maximizing the number of templates or AI features.
