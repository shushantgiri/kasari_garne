"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * A button that opens a fixed popup (native <dialog>: focus stays inside, Esc closes).
 * The page behind doesn't scroll while it's open; long content scrolls inside the popup only.
 */
export function InfoDialog({ label, title, icon, closeLabel, children }: {
  label: string;
  title: string;
  icon?: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  const show = () => {
    ref.current?.showModal();
    setOpen(true);
  };
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" onClick={show} className="btn-secondary" aria-haspopup="dialog">
        {icon}
        {label}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        // A click on the dimmed backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => e.target === ref.current && close()}
        aria-labelledby="info-dialog-title"
        className="m-auto w-[min(94vw,40rem)] max-h-[88vh] overflow-hidden rounded-2xl border border-paper-line bg-white p-0 text-ink shadow-pop backdrop:bg-ink/40 open:animate-pop"
      >
        <div className="flex max-h-[88vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-paper-line bg-paper-warm px-5 py-4 sm:px-6">
            <h2 id="info-dialog-title" className="text-xl font-bold tracking-tight text-ink">{title}</h2>
            <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white hover:text-ink" aria-label={closeLabel}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        </div>
      </dialog>
    </>
  );
}
