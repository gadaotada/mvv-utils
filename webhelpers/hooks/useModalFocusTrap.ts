import { useEffect, useRef, type RefObject } from "react";

export type UseModalFocusTrapParams = {
  elementRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  enabled?: boolean;
  restoreFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex >= 0,
  );
}

export function useModalFocusTrap({
  elementRef,
  isOpen,
  enabled = true,
  restoreFocus = true,
  initialFocusRef,
}: UseModalFocusTrapParams): void {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !isOpen || typeof document === "undefined") {
      return;
    }

    const container = elementRef.current;
    if (!container) {
      return;
    }

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const focusables = getFocusableElements(container);
    const initialTarget = initialFocusRef?.current ?? focusables[0] ?? container;

    if (initialTarget === container && container.tabIndex < 0) {
      container.setAttribute("tabindex", "-1");
    }

    initialTarget.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Tab") {
        return;
      }

      const currentContainer = elementRef.current;
      if (!currentContainer) {
        return;
      }

      const currentFocusables = getFocusableElements(currentContainer);
      if (currentFocusables.length === 0) {
        event.preventDefault();
        currentContainer.focus();
        return;
      }

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === first || !activeElement || !currentContainer.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last || !activeElement || !currentContainer.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (restoreFocus) {
        previousActiveElementRef.current?.focus();
      }
    };
  }, [elementRef, enabled, initialFocusRef, isOpen, restoreFocus]);
}

