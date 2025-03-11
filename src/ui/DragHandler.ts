export class DragHandlerEvent {
    event: PointerEvent;
    target: HTMLElement;
    dx: number;
    dy: number;

    constructor(
        type: string,
        event: PointerEvent,
        element: HTMLElement,
        dx: number = 0,
        dy: number = 0,
    ) {
        this.event = event;
        this.target = element;
        this.dx = dx;
        this.dy = dy;
    }
}

const DRAG_START_THRESHOLD = 5;
const DRAG_MOVE_THRESHOLD = 0.5;
const MAX_TAP_THRESHOLD = 10;

export class DragHandler {
    element: HTMLElement;
    pointerDown?: boolean;
    dragging?: boolean;
    clientXstart: number = 0;
    clientYstart: number = 0;
    clientX: number = 0;
    clientY: number = 0;

    onDragStart?: (evt: DragHandlerEvent) => void;
    onDragMove?: (evt: DragHandlerEvent) => void;
    onDragEnd?: (evt: DragHandlerEvent) => void;
    onTap?: (evt: DragHandlerEvent) => void;

    constructor(element: HTMLElement) {
        this.element = element;
        console.log(element);

        element.addEventListener("pointerdown", (evt: PointerEvent) =>
            this.handlePointerDown(evt),
        );
        element.addEventListener("pointermove", (evt: PointerEvent) =>
            this.handlePointerMove(evt),
        );
        element.addEventListener("pointerup", (evt: PointerEvent) =>
            this.handlePointerUp(evt),
        );
        element.addEventListener("pointercancel", (evt: PointerEvent) =>
            this.handlePointerCancel(evt),
        );
        element.addEventListener("pointerleave", (evt: PointerEvent) =>
            this.handlePointerCancel(evt),
        );
    }

    handlePointerDown(evt: PointerEvent) {
        this.pointerDown = true;
        this.clientXstart = this.clientX = evt.clientX;
        this.clientYstart = this.clientY = evt.clientY;
        console.log("pointerdown", this.element);
        evt.preventDefault();
    }

    handlePointerMove(evt: PointerEvent) {
        if (this.pointerDown && !this.dragging) {
            this.element.setPointerCapture(evt.pointerId);
            const dxTotal = evt.clientX - this.clientXstart;
            const dyTotal = evt.clientY - this.clientYstart;
            if (
                dxTotal !== 0 &&
                dyTotal !== 0 &&
                Math.hypot(dxTotal, dyTotal) > DRAG_START_THRESHOLD
            ) {
                this.dragging = true;
                if (this.onDragStart) {
                    this.onDragStart(
                        new DragHandlerEvent("dragstart", evt, this.element),
                    );
                }
            }
        }
        const dx = evt.clientX - this.clientX;
        const dy = evt.clientY - this.clientY;
        if (
            this.dragging &&
            dx !== 0 &&
            dy !== 0 &&
            Math.hypot(dx, dy) > DRAG_MOVE_THRESHOLD
        ) {
            if (this.onDragMove) {
                this.onDragMove(
                    new DragHandlerEvent("dragmove", evt, this.element, dx, dy),
                );
            }
            this.clientX = evt.clientX;
            this.clientY = evt.clientY;
        }
        evt.preventDefault();
    }

    handlePointerUp(evt: PointerEvent) {
        const dx = evt.clientX - this.clientX!;
        const dy = evt.clientY - this.clientY!;
        const dxTotal = evt.clientX - this.clientXstart;
        const dyTotal = evt.clientY - this.clientYstart;
        this.pointerDown = false;
        if (this.dragging) {
            this.dragging = false;
            if (this.onDragEnd) {
                this.onDragEnd(
                    new DragHandlerEvent("dragend", evt, this.element, dx, dy),
                );
            }
        }
        if (Math.hypot(dxTotal, dyTotal) < MAX_TAP_THRESHOLD) {
            if (this.onTap) {
                this.onTap(new DragHandlerEvent("tap", evt, this.element));
            }
        }
        evt.preventDefault();
        this.element.releasePointerCapture(evt.pointerId);
    }

    handlePointerCancel(evt: PointerEvent) {
        this.pointerDown = false;
        if (this.dragging) {
            this.dragging = false;
            if (this.onDragEnd) {
                this.onDragEnd(
                    new DragHandlerEvent(
                        "dragend",
                        evt,
                        this.element,
                        evt.clientX - this.clientX,
                        evt.clientY - this.clientY,
                    ),
                );
            }
        }
        evt.preventDefault();
        this.element.releasePointerCapture(evt.pointerId);
    }
}
