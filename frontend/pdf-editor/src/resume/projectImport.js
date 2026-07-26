export async function openProjectFileAtomically(file, dependencies) {
  const { readBundle, commitBundle } = dependencies || {};
  if (
    typeof readBundle !== "function" ||
    typeof commitBundle !== "function"
  ) {
    throw new TypeError("Project import dependencies are incomplete.");
  }

  const bundle = await readBundle(file);
  await commitBundle(bundle);
  return bundle;
}
