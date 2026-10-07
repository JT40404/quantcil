"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "./Clock";

const LINKS = [
  { href: "#calls", label: "Calls" },
  { href: "#ask", label: "Ask the council" },
  { href: "#members", label: "The quants" },
  { href: "#method", label: "Method" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.toggle("locked", open);
    if (open) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    menuBtnRef.current?.focus();
  }

  return (
    <>
      <header className="nav">
        <a href="#top" className="wordmark">
          <span className="logo" aria-hidden="true"><i /><i /><i /><i /></span>
          the quantcil
        </a>
        <button ref={menuBtnRef} type="button" className="menu-btn" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
          menu
        </button>
      </header>

      {open && (
        <div id="site-menu" className="menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="menu-top">
            <span className="wordmark">
              <span className="logo" aria-hidden="true"><i /><i /><i /><i /></span>
              the quantcil
            </span>
            <button ref={closeRef} type="button" className="menu-btn" onClick={close}>close</button>
          </div>
          <nav className="menu-links" aria-label="Main">
            {LINKS.map((l, i) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
                <sup>{String(i + 1).padStart(2, "0")}</sup>
              </a>
            ))}
          </nav>
          <div className="menu-foot">
            <span>All rights reserved ({new Date().getFullYear()})</span>
            <Clock />
            <span>Not financial advice</span>
          </div>
        </div>
      )}
    </>
  );
}
