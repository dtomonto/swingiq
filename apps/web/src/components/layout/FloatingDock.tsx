'use client';

// ============================================================
// SwingVantage — Floating Utility Dock
// ------------------------------------------------------------
// THE single owner of the bottom-right corner. Every persistent
// floating help/support tool (AI Coach, Guide companion, and any
// future floating widget) is a CHILD of this dock. The dock — not
// the individual tools — owns:
//   • position  (fixed, bottom-right, clear of the mobile bottom nav)
//   • spacing   (a consistent vertical gap between launchers)
//   • z-index   (one shared scale: launchers < panels)
//   • safe-area (iOS notch / home-indicator insets)
//
// It also guarantees that AT MOST ONE tool panel is expanded at a
// time, so two panels can never overlap. Tools read their open
// state from `useFloatingDock(id)` instead of owning a `fixed`
// position or their own open boolean.
//
// ⚠️  Do NOT add a new `fixed bottom-… right-…` widget anywhere
//     else. Add it as a dock child here. See
//     docs/FLOATING_UTILITY_DOCK.md for the rationale + recipe.
//
// The actual position/spacing/z math lives in globals.css
// (`.floating-dock` / `.floating-panel` + the `--floating-dock-*`
// tokens) so it is theme-independent and easy to audit in one place.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface DockApi {
  /** id of the single currently-expanded tool, or null. */
  openId: string | null;
  open: (id: string) => void;
  close: (id: string) => void;
  toggle: (id: string) => void;
}

const DockContext = createContext<DockApi | null>(null);

/**
 * Connect a floating tool to the dock.
 *
 * Returns the tool's open state plus mutually-exclusive controls:
 * opening one tool automatically collapses any other, which is what
 * guarantees two panels can never be on screen at once.
 *
 * Must be called inside a `<FloatingDock>`.
 */
export function useFloatingDock(id: string) {
  const ctx = useContext(DockContext);
  if (!ctx) {
    throw new Error('useFloatingDock must be used within <FloatingDock>');
  }
  const { openId, open, close, toggle } = ctx;
  return {
    isOpen: openId === id,
    open: useCallback(() => open(id), [open, id]),
    close: useCallback(() => close(id), [close, id]),
    toggle: useCallback(() => toggle(id), [toggle, id]),
  };
}

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function FloatingDock({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const open = useCallback((id: string) => setOpenId(id), []);
  // close()/toggle() only act on the matching id so a tool can never
  // accidentally collapse a sibling that happens to be open.
  const close = useCallback(
    (id: string) => setOpenId((cur) => (cur === id ? null : cur)),
    [],
  );
  const toggle = useCallback(
    (id: string) => setOpenId((cur) => (cur === id ? null : id)),
    [],
  );

  // Publish the live launcher-cluster height so `.floating-panel` can anchor
  // ABOVE the dock without hard-coded magic numbers — it stays correct whether
  // 0, 1, or 2 launchers are mounted on a given route.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty('--floating-dock-height', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--floating-dock-height');
    };
  }, []);

  return (
    <DockContext.Provider value={{ openId, open, close, toggle }}>
      <div
        ref={ref}
        className="floating-dock no-print"
        data-testid="floating-help-dock"
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}
