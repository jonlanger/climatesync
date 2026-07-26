"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { WELCOME_HIGHLIGHTS } from "@/data/how-to-use";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "climate-sync:welcome-seen";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // Private mode / blocked storage: still show once per session.
    }
    setOpen(true);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/55 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex h-[60vh] w-[60vw] max-h-[60vh] max-w-[60vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--panel-fg)] shadow-2xl outline-none transition duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--panel-border)] px-6 py-5 md:px-8">
            <div className="min-w-0">
              <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
                Welcome
              </p>
              <Dialog.Title className="font-heading mt-1 text-2xl tracking-tight text-[color:var(--panel-fg)] md:text-3xl">
                Climate Sync
              </Dialog.Title>
              <Dialog.Description className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--panel-muted)] md:text-base">
                Find cities that share climate fingerprints—so adaptation ideas can travel
                between places facing similar weather, water, and risk.
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
                  aria-label="Close welcome"
                />
              }
            >
              <XIcon />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8">
            <h3 className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
              Getting started
            </h3>
            <ol className="mt-3 space-y-3">
              {WELCOME_HIGHLIGHTS.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed md:text-base">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[color:var(--panel-accent)] font-mono text-xs text-[#f2c14e]">
                    {index + 1}
                  </span>
                  <span className="text-[color:var(--panel-fg)]/90">{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-[color:var(--panel-muted)]">
              Want the full walkthrough? Open{" "}
              <Link
                href="/how-to-use"
                onClick={dismiss}
                className="text-[#7dd3c0] underline-offset-2 hover:underline"
              >
                How to Use
              </Link>{" "}
              anytime from the sidebar.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--panel-border)] px-6 py-4 md:px-8">
            <Button
              variant="outline"
              render={<Link href="/how-to-use" onClick={dismiss} />}
              className="border-[color:var(--panel-border)] bg-transparent text-[color:var(--panel-fg)] hover:bg-[color:var(--panel-hover)]"
            >
              Read instructions
            </Button>
            <Button
              onClick={dismiss}
              className="bg-[#f2c14e] text-[#0a1620] hover:bg-[#f2c14e]/90"
            >
              Start exploring
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
