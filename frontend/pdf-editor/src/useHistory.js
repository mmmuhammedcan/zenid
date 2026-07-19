import { useCallback, useRef, useState } from "react";

// A simple undo/redo stack of full canvas JSON snapshots. Fabric objects
// aren't easy to diff incrementally, so we snapshot the whole canvas on each
// meaningful change instead — simpler and reliable at this canvas size.
export default function useHistory(maxSize = 50) {
  const stackRef = useRef([]);
  const indexRef = useRef(-1);
  // Set while WE are the ones mutating the canvas (undo/redo/restoring a
  // saved page) so the resulting object:added/removed events don't get
  // recorded as new history entries.
  const isRestoringRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = () => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < stackRef.current.length - 1);
  };

  const reset = useCallback((initialState) => {
    stackRef.current = initialState ? [initialState] : [];
    indexRef.current = stackRef.current.length - 1;
    syncFlags();
  }, []);

  const push = useCallback((state) => {
    if (isRestoringRef.current) return;
    // Branching after an undo drops whatever "future" existed
    stackRef.current = stackRef.current.slice(0, indexRef.current + 1);
    stackRef.current.push(state);
    if (stackRef.current.length > maxSize) stackRef.current.shift();
    indexRef.current = stackRef.current.length - 1;
    syncFlags();
  }, [maxSize]);

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    syncFlags();
    return stackRef.current[indexRef.current];
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current >= stackRef.current.length - 1) return null;
    indexRef.current += 1;
    syncFlags();
    return stackRef.current[indexRef.current];
  }, []);

  return { push, undo, redo, reset, canUndo, canRedo, isRestoringRef };
}
