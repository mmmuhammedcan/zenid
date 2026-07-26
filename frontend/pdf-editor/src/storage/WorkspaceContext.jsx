/* oxlint-disable react/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  commitProjectBundle,
  commitProjectMediaChange,
  loadWorkspaceProject,
  saveWorkspaceProject,
} from "./workspaceStore.js";

const WorkspaceContext = createContext(null);
const WORKSPACE_LOCK_NAME = "zenid-private-workspace-writer";
let sharedHydration;

function hydrateWorkspace() {
  sharedHydration ||= loadWorkspaceProject();
  return sharedHydration;
}

export function WorkspaceProvider({ children }) {
  const [ownership, setOwnership] = useState("checking");
  const [project, setProjectState] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const writeQueue = useRef(Promise.resolve());
  const skipAutosave = useRef(false);

  useEffect(() => {
    let mounted = true;
    let lockAcquired = false;
    let releaseLock;
    const lockManager = globalThis.navigator?.locks;
    if (!lockManager) {
      setOwnership("unsupported");
      return undefined;
    }

    const controller = new AbortController();
    const waitingTimer = globalThis.setTimeout(() => {
      if (mounted && !lockAcquired) setOwnership("waiting");
    }, 150);

    lockManager.request(
      WORKSPACE_LOCK_NAME,
      { mode: "exclusive", signal: controller.signal },
      async () => {
        if (!mounted) return;
        lockAcquired = true;
        globalThis.clearTimeout(waitingTimer);
        setOwnership("owned");
        await new Promise((resolve) => {
          releaseLock = resolve;
        });
      }
    ).catch((error) => {
      if (!mounted || error?.name === "AbortError") return;
      console.warn("ZenID could not acquire exclusive local workspace ownership.", error);
      setOwnership("unsupported");
    });

    return () => {
      mounted = false;
      globalThis.clearTimeout(waitingTimer);
      controller.abort();
      releaseLock?.();
    };
  }, []);

  useEffect(() => {
    if (ownership !== "owned") return undefined;
    let active = true;
    hydrateWorkspace()
      .then((loaded) => {
        if (!active) return;
        setProjectState(loaded);
        setHydrated(true);
      })
      .catch((error) => {
        if (!active) return;
        setStorageError(error);
        setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [ownership]);

  useEffect(() => {
    if (!hydrated || !project) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    writeQueue.current = writeQueue.current
      .catch(() => {})
      .then(() => saveWorkspaceProject(project))
      .then(() => setStorageError(null))
      .catch((error) => {
        console.warn("ZenID could not autosave the local workspace.", error);
        setStorageError(error);
      });
  }, [hydrated, project]);

  const value = useMemo(() => ({
    project,
    hydrated,
    storageError,
    clearStorageError: () => setStorageError(null),
    setProject: setProjectState,
    replaceProjectBundle: async (bundle) => {
      await writeQueue.current.catch(() => {});
      const committed = await commitProjectBundle(bundle.project, bundle.assets);
      skipAutosave.current = true;
      setProjectState(committed);
      setStorageError(null);
      return committed;
    },
    commitMediaProject: async (nextProject, operations) => {
      await writeQueue.current.catch(() => {});
      const committed = await commitProjectMediaChange(nextProject, operations);
      skipAutosave.current = true;
      setProjectState(committed);
      setStorageError(null);
      return committed;
    },
  }), [hydrated, project, storageError]);

  if (ownership === "unsupported") {
    return (
      <div className="p-8 text-sm text-red-300" role="alert">
        This browser cannot safely lock the private ZenID workspace. Update to a current browser, then reload this page.
      </div>
    );
  }
  if (ownership === "waiting") {
    return (
      <div className="p-8 text-sm text-amber-200" role="alert">
        ZenID is already open in another tab. Continue there, or close it and this tab will open automatically.
      </div>
    );
  }
  if (ownership !== "owned" || !hydrated) {
    return <div className="p-8 text-sm text-stone-400">Opening your local workspace…</div>;
  }
  if (!project) {
    return (
      <div className="p-8 text-sm text-red-300" role="alert">
        ZenID could not open its private local workspace. Close other ZenID tabs, then reload this page.
      </div>
    );
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  return value;
}
