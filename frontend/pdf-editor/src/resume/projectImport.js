export async function openProjectFileAtomically(file, dependencies) {
  const { readBundle, persistAssets, commitProject } = dependencies || {};
  if (
    typeof readBundle !== "function" ||
    typeof persistAssets !== "function" ||
    typeof commitProject !== "function"
  ) {
    throw new TypeError("Project import dependencies are incomplete.");
  }

  const bundle = await readBundle(file);
  await persistAssets(bundle.assets);
  commitProject(bundle.project);
  return bundle;
}
