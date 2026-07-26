# SPEC-007 Manual Acceptance — Windows and Android

Status: Ready for creator execution
Decision: D-016
Evidence rule: use only synthetic identity and document data

This checklist does not claim macOS, iOS, iPadOS, physical low-memory import,
or certificate-backed signature acceptance.

## Test environment record

- Date:
- Tested deployment URL:
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

- [ ] Home, Resume, Portfolio, and ZenPDF are reachable without horizontal
  document scrolling at the normal desktop viewport.
- [ ] Tab and Shift+Tab reach every interactive control in a logical order.
- [ ] The focused control is always visibly identifiable.
- [ ] Enter and Space operate links, buttons, checkboxes, and file controls as
  expected.
- [ ] No component traps keyboard focus; dialogs return focus to the control
  that opened them.
- [ ] Resume creation, Portfolio editing/review, and ZenPDF page navigation and
  export can be completed without a pointer.

## Windows zoom — Chrome and Firefox

- [ ] At 200% zoom, all four routes retain their content and controls without
  overlap or clipping.
- [ ] At 400% zoom, content reflows to a narrow layout; text and controls remain
  reachable without two-dimensional page scrolling.
- [ ] Browser text-size changes do not hide status, recovery, privacy-review,
  or error guidance.

## Windows screen reader

Use NVDA with either current Firefox or Chrome.

- [ ] Page titles, landmark regions, and main headings identify each route.
- [ ] Buttons, links, inputs, checkboxes, and file controls announce meaningful
  accessible names and state.
- [ ] Resume and Portfolio step changes are understandable without relying on
  color or position alone.
- [ ] Success, validation, import-recovery, and storage-error messages are
  announced when they appear.
- [ ] ZenPDF previous/next page controls and the current page count are
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

- [ ] All required Windows items passed.
- [ ] All required Android items passed.
- [ ] Any failures have tracked tasks and are not silently accepted.
- Creator:
- Date:
- Result: Pending
- Notes:
