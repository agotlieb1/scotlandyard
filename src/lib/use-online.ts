import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getSnapshot = () => navigator.onLine;

// The server cannot know, and assuming online avoids a hydration flip.
const getServerSnapshot = () => true;

export const useIsOnline = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
