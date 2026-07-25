import { parseProjectBundleBytes } from "./projectFile.js";

self.onmessage = ({ data }) => {
  try {
    const bundle = parseProjectBundleBytes(new Uint8Array(data.bytes));
    const transfers = [
      ...new Set(bundle.assets.map((asset) => asset.bytes.buffer)),
    ];
    self.postMessage({ ok: true, bundle }, transfers);
  } catch (error) {
    self.postMessage({
      ok: false,
      error: {
        name: error?.name || "Error",
        code: error?.code,
        message: error?.message || "This ZenID project could not be opened.",
      },
    });
  }
};
