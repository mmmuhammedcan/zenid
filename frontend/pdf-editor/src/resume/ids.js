export function createStableId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Older browsers may not expose randomUUID. This fallback still produces a
  // portable string ID and avoids the collisions caused by a module counter
  // restarting whenever ZenID is reopened.
  const randomPart = Math.random().toString(36).slice(2);
  return `zenid-${Date.now().toString(36)}-${randomPart}`;
}
