"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * A button that opens a fixed popup (native <dialog>: focus stays inside, Esc closes).
 * The page behind doesn't scroll while it's open; long content scrolls inside the popup only.
 * It rises in when opened and sinks out when closed (Esc, ✕ or a tap on the backdrop).
 */
export function InfoDialog({ label, title, icon, closeLabel, buttonClassName = "btn-secondary", children }: {
  label: string;
  /** The opening button's look; a large secondary button unless set. */
  buttonClassName?: string;
  title: string;
  icon?: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // While true, the close animation plays; the dialog really closes when it ends.
  const [closing, setClosing] = useState(false);

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
  const close = () => setClosing(true);

  return (
    <>
      <button type="button" onClick={show} className={buttonClassName} aria-haspopup="dialog">
        {icon}
        {label}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        // Esc: animate out instead of vanishing.
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onAnimationEnd={(e) => {
          if (closing && e.target === ref.current) {
            setClosing(false);
            ref.current?.close();
          }
        }}
        // A click on the dimmed backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => e.target === ref.current && close()}
        aria-labelledby="info-dialog-title"
        className={`m-auto w-[min(94vw,40rem)] max-h-[88vh] overflow-hidden rounded-2xl border border-paper-line bg-white p-0 text-left text-base font-normal text-ink shadow-pop backdrop:bg-ink/40 ${closing ? "is-closing animate-dialog-out" : "open:animate-dialog-in"}`}
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
