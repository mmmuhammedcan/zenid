// Node host adapter for SPEC-011 (T002).
//
// The browser supplies three things that the pure export functions cannot get
// for themselves: the résumé font bytes, a base64 encoder, and file I/O. This
// module supplies the same three under Node so that `buildResumePdf`,
// `serializeProjectArchive`, and `serializePortfolioSite` can run unchanged
// outside a page. No existing function signature changes.
//
// Per SPEC-011 Q-006 no letterhead loader is needed: `buildResumePdf` defaults
// `letterhead` to false and no caller sets it to true.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

// Mirrors FONT_ASSETS in resume/resumePdfExport.js. `buildResumePdf` addresses
// the faces it registers by these same file names.
export const RESUME_FONT_FILES = {
  normal: "NotoSans-Regular.ttf",
  bold: "NotoSans-Bold.ttf",
  italic: "NotoSans-Italic.ttf",
};

// The fonts ship with the application under public/assets/fonts. A packaged
// build copies them next to this module, so both layouts are accepted.
const FONT_SEARCH_DIRECTORIES = [
  path.resolve(moduleDirectory, "../../public/assets/fonts"),
  path.resolve(moduleDirectory, "./assets/fonts"),
];

export function bytesToBase64(bytes) {
  return Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString("base64");
}

async function readFirstExisting(fileName) {
  let lastError;
  for (const directory of FONT_SEARCH_DIRECTORIES) {
    try {
      return await readFile(path.join(directory, fileName));
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Unable to load resume font: ${fileName} (${lastError?.code || "not found"})`);
}

// Returns the { normal, bold, italic } base64 map that `buildResumePdf`
// accepts as its `fontData` option.
export async function loadResumeFontData() {
  const entries = await Promise.all(
    Object.entries(RESUME_FONT_FILES).map(async ([style, fileName]) => [
      style,
      bytesToBase64(await readFirstExisting(fileName)),
    ])
  );
  return Object.fromEntries(entries);
}

export async function readBytes(filePath) {
  return new Uint8Array(await readFile(filePath));
}

export async function writeBytes(filePath, bytes) {
  await writeFile(filePath, Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)));
  return filePath;
}
