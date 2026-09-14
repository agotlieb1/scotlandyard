"use client";

import { Button } from "@mui/material";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Only renders where the browser offers an install prompt (Chrome, Edge,
 * Android). Safari has no such event — there you use Share > Add to Home
 * Screen, which the manifest and apple-touch-icon already support.
 */
export default function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) {
    return null;
  }

  return (
    <Button
      size="small"
      variant="contained"
      onClick={async () => {
        await prompt.prompt();
        setPrompt(null);
      }}
    >
      Install
    </Button>
  );
}
