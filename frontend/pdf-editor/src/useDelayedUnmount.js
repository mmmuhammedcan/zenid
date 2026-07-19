import { useEffect, useState } from "react";

// Keeps a component mounted for `delay` ms after `isMounted` goes false, so a
// CSS opacity/transform transition can play out before it's actually removed
// from the DOM. Pair with a className that reads `isMounted` for the visible
// vs. hidden state.
export default function useDelayedUnmount(isMounted, delay = 200) {
  const [shouldRender, setShouldRender] = useState(isMounted);

  useEffect(() => {
    let timeoutId;
    if (isMounted) {
      setShouldRender(true);
    } else {
      timeoutId = setTimeout(() => setShouldRender(false), delay);
    }
    return () => clearTimeout(timeoutId);
  }, [isMounted, delay]);

  return shouldRender;
}
