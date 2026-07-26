# SPEC-007 Manual Acceptance — Windows and Android

Status: Ready for creator execution
Decision: D-016
Evidence rule: use only synthetic identity and document data

This checklist does not claim macOS, iOS, iPadOS, physical low-memory import,
or certificate-backed signature acceptance.

## Supplemental Ubuntu screen-reader smoke

- Date: 2026-07-26
- Environment: Ubuntu with Orca 46.1
- Browser/version: not captured
- Result: Pass as supplemental evidence
- Creator report: Orca operated with the application and the exercised
  behavior appeared correct. Orca announced the interface in English and its
  default verbosity was higher than the creator preferred, after which the
  creator turned it off.
- Interpretation: English speech is expected because the current release
  interface and page language are English. The verbosity is an assistive-tool
  preference, not by itself an application failure.

This smoke does not complete any Windows NVDA or Android TalkBack checklist
item and does not close T009.

## Windows Chrome, Firefox, and NVDA acceptance

- Date: 2026-07-26
- Device: creator's family member's Windows computer
- Windows, Chrome, and NVDA versions: not captured
- NVDA mode: temporary copy started by the downloaded launcher; not installed
- Creator report: the required Windows behavior passed in both Chrome and
  Firefox, and the temporary NVDA copy read the site content and controls
  correctly in Chrome. No application failure was observed.
- Localization observation: Chrome's page translation presented the live
  interface in Turkish, while an exported resume retained English default
  section labels.
- Interpretation: browser translation changes the presented web page but is
  not a ZenID resume-content locale selection. English export labels are
  expected in the current English release; native Turkish localization remains
  deferred.

The creator accepted the Windows functional matrix. Exact environment versions
remain uncaptured metadata and are not inferred. T009 remains open for Android.

## Test environment record

- Date: 2026-07-26
- Tested deployment URL:
  `https://zenid-local-workspace.cosmican.chatgpt.site`
- Windows version:
- Chrome version:
- Firefox version:
- Android device/model:
- Android version:
- Chrome version:
- TalkBack version:

Record Pass, Fail, or Blocked for every item. A failure must include the route,
action, expected result, actual result, and a screenshot when safe.

## Windows keyboard — Chrome and Firefox

Repeat on both browsers.

- [x] Home, Resume, Portfolio, and ZenPDF are reachable without horizontal
  document scrolling at the normal desktop viewport.
- [x] Tab and Shift+Tab reach every interactive control in a logical order.
- [x] The focused control is always visibly identifiable.
- [x] Enter and Space operate links, buttons, checkboxes, and file controls as
  expected.
- [x] No component traps keyboard focus; dialogs return focus to the control
  that opened them.
- [x] Resume creation, Portfolio editing/review, and ZenPDF page navigation and
  export can be completed without a pointer.

## Windows zoom — Chrome and Firefox

- [x] At 200% zoom, all four routes retain their content and controls without
  overlap or clipping.
- [x] At 400% zoom, content reflows to a narrow layout; text and controls remain
  reachable without two-dimensional page scrolling.
- [x] Browser text-size changes do not hide status, recovery, privacy-review,
  or error guidance.

## Windows screen reader

Use NVDA with either current Firefox or Chrome.

- [x] Page titles, landmark regions, and main headings identify each route.
- [x] Buttons, links, inputs, checkboxes, and file controls announce meaningful
  accessible names and state.
- [x] Resume and Portfolio step changes are understandable without relying on
  color or position alone.
- [x] Success, validation, import-recovery, and storage-error messages are
  announced when they appear.
- [x] ZenPDF previous/next page controls and the current page count are
  understandable.

## Android Chrome and TalkBack

- [ ] Home, Resume, Portfolio, and ZenPDF load in portrait and landscape
  without clipped primary actions.
- [ ] Touch targets are usable without accidental adjacent activation.
- [ ] TalkBack focus order follows the visual/task order and every interactive
  control has a meaningful name and state.
- [ ] A synthetic `.zenid` project can be opened locally and saved again.
- [ ] A synthetic two-page PDF can be opened, navigated, and exported locally.
- [ ] Portfolio edit/preview switching and publication review remain usable.
- [ ] Leaving the browser and returning preserves the current local workspace.
- [ ] Opening a second writable tab shows the single-writer protection rather
  than allowing concurrent edits.

## Acceptance result

- [x] All required Windows items passed.
- [ ] All required Android items passed.
- [ ] Any failures have tracked tasks and are not silently accepted.
- Creator:
- Date:
- Result: Pending
- Notes:
