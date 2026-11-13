"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function ShiftDetailLink({ shiftId, page, className, children }: {
  shiftId: string; page: number; className: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const id = `shift-${shiftId}`;
  useEffect(() => {
    function restore() {
      const back = window.history.state?.recruitmentReturn;
      if (back?.id !== id && window.location.hash !== `#${id}`) return;
      if (document.activeElement !== document.body && document.activeElement !== ref.current) return;
      if (back?.id === id) {
        window.scrollTo(0, back.y);
        const state = { ...window.history.state };
        delete state.recruitmentReturn;
        window.history.replaceState(state, "");
      } else {
        ref.current?.scrollIntoView({ block: "center" });
      }
      ref.current?.focus({ preventScroll: true });
    }
    restore();
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [id]);
  return (
    <Link id={id} ref={ref} className={className}
      href={`/worker/recruitment/${shiftId}${page ? `?page=${page}` : ""}`}
      onNavigate={() => window.history.replaceState({
        ...window.history.state, recruitmentReturn: { id, y: window.scrollY },
      }, "")}>
      {children}
    </Link>
  );
}
