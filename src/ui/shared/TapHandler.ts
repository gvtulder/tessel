export class TapHandlerEvent {
    event: PointerEvent;
    target: HTMLElement;
    handler: TapHandler;

    constructor(
        type: string,
        event: PointerEvent,
        target: HTMLElement,
        handler: TapHandler,
    ) {
        this.event = event;
        this.target = target;
        this.handler = handler;
    }
}

export class TapHandler {
    element: HTMLElement;

    onTap?: (evt: TapHandlerEvent) => void;

    pointerDownEventListener: (evt: PointerEvent) => void;
    pointerUpEventListener: (evt: PointerEvent) => void;

    constructor(element: HTMLElement) {
        this.element = element;

        element.addEventListener(
            "pointerdown",
            (this.pointerDownEventListener = (evt: PointerEvent) =>
                this.handlePointerDown(evt)),
        );
        element.addEventListener(
            "pointerup",
            (this.pointerUpEventListener = (evt: PointerEvent) =>
                this.handlePointerUp(evt)),
        );
    }

    handlePointerDown(evt: PointerEvent) {
        evt.preventDefault();
    }

    handlePointerUp(evt: PointerEvent) {
        if (this.onTap) {
            this.onTap(new TapHandlerEvent("tap", evt, this.element, this));
        }
        evt.preventDefault();
    }

    destroy() {
        this.element.removeEventListener(
            "pointerdown",
            this.pointerDownEventListener,
        );
        this.element.removeEventListener(
            "pointerup",
            this.pointerUpEventListener,
        );
    }
}
