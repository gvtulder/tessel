export interface ScreenDisplay extends EventTarget {
    element: HTMLElement;
    rescale(): void;
    destroy(): void;
}
