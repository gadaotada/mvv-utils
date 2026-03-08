import { useEffect, useRef, type RefObject } from "react";

type LayerEntry = {
  id: number;
  elementRef: RefObject<HTMLElement | null>;
  getOpen: () => boolean;
  getCloseOnOutsidePress: () => boolean;
  getCloseOnEscapeKey: () => boolean;
  dismiss: () => void;
};

let nextLayerId = 1;
const layerEntries: LayerEntry[] = [];
let listenersBound = false;

function onPointerDown(event: MouseEvent) {
  const target = event.target;
  dismissTopLayerIfOutside(target instanceof Node ? target : null);
}

function dismissTopLayerIfOutside(target: Node | null) {
  if (!target) return;

  for (let i = layerEntries.length - 1; i >= 0; i--) {
    const entry = layerEntries[i];
    if (!entry.getOpen()) continue;

    const element = entry.elementRef.current;
    if (!element) continue;

    if (!entry.getCloseOnOutsidePress()) return;

    if (!element.contains(target)) {
      entry.dismiss();
    }
    return;
  }
}

function dismissTopLayerOnEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;

  for (let i = layerEntries.length - 1; i >= 0; i--) {
    const entry = layerEntries[i];
    if (!entry.getOpen()) continue;
    if (!entry.getCloseOnEscapeKey()) return;
    entry.dismiss();
    return;
  }
}

function bindListeners() {
  if (listenersBound || typeof window === "undefined") return;

  window.addEventListener("mousedown", onPointerDown);
  window.addEventListener("keydown", dismissTopLayerOnEscape);
  listenersBound = true;
}

function unbindListenersIfIdle() {
  if (!listenersBound || layerEntries.length > 0 || typeof window === "undefined") return;
  window.removeEventListener("mousedown", onPointerDown);
  window.removeEventListener("keydown", dismissTopLayerOnEscape);
  listenersBound = false;
}

export function useDismissableLayer(params: {
  elementRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  closeOnOutsidePress?: boolean;
  closeOnEscapeKey?: boolean;
  onDismiss: () => void;
}) {
  const layerIdRef = useRef<number>(nextLayerId++);
  const isOpenRef = useRef(params.isOpen);
  const closeOnOutsidePressRef = useRef(params.closeOnOutsidePress ?? true);
  const closeOnEscapeKeyRef = useRef(params.closeOnEscapeKey ?? true);
  const dismissRef = useRef(params.onDismiss);

  useEffect(() => {
    isOpenRef.current = params.isOpen;
  }, [params.isOpen]);

  useEffect(() => {
    dismissRef.current = params.onDismiss;
  }, [params.onDismiss]);

  useEffect(() => {
    closeOnOutsidePressRef.current = params.closeOnOutsidePress ?? true;
  }, [params.closeOnOutsidePress]);

  useEffect(() => {
    closeOnEscapeKeyRef.current = params.closeOnEscapeKey ?? true;
  }, [params.closeOnEscapeKey]);

  useEffect(() => {
    bindListeners();

    const entry: LayerEntry = {
      id: layerIdRef.current,
      elementRef: params.elementRef,
      getOpen: () => isOpenRef.current,
      getCloseOnOutsidePress: () => closeOnOutsidePressRef.current,
      getCloseOnEscapeKey: () => closeOnEscapeKeyRef.current,
      dismiss: () => dismissRef.current()
    };

    layerEntries.push(entry);
    return () => {
      const index = layerEntries.findIndex((item) => item.id === entry.id);
      if (index >= 0) layerEntries.splice(index, 1);
      unbindListenersIfIdle();
    };
  }, [params.elementRef]);
}
