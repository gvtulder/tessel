/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export class DragHandlerEvent {
    event: PointerEvent;
    target: HTMLElement;
    handler: DragHandler;
    dx: number;
    dy: number;
    dtime: number;

    constructor(
        type: string,
        event: PointerEvent,
        target: HTMLElement,
        handler: DragHandler,
        dx: number = 0,
        dy: number = 0,
        dtime: number = 0,
    ) {
        this.event = event;
        this.target = target;
        this.handler = handler;
        this.dx = dx;
        this.dy = dy;
        this.dtime = dtime;
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
    previousTimestamp = 0;
    startTimestamp = 0;

    onDragStart?: (evt: DragHandlerEvent) => void;
    onDragMove?: (evt: DragHandlerEvent) => void;
    onDragEnd?: (evt: DragHandlerEvent) => void;
    onTap?: (evt: DragHandlerEvent) => void;

    pointerDownEventListener: (evt: PointerEvent) => void;
    pointerMoveEventListener: (evt: PointerEvent) => void;
    pointerUpEventListener: (evt: PointerEvent) => void;
    pointerCancelEventListener: (evt: PointerEvent) => void;
    pointerLeaveEventListener: (evt: PointerEvent) => void;

    constructor(element: HTMLElement) {
        this.element = element;

        element.addEventListener(
            "pointerdown",
            (this.pointerDownEventListener = (evt: PointerEvent) =>
                this.handlePointerDown(evt)),
        );
        element.addEventListener(
            "pointermove",
            (this.pointerMoveEventListener = (evt: PointerEvent) =>
                this.handlePointerMove(evt)),
        );
        element.addEventListener(
            "pointerup",
            (this.pointerUpEventListener = (evt: PointerEvent) =>
                this.handlePointerUp(evt)),
        );
        element.addEventListener(
            "pointercancel",
            (this.pointerCancelEventListener = (evt: PointerEvent) =>
                this.handlePointerCancel(evt)),
        );
        element.addEventListener(
            "pointerleave",
            (this.pointerLeaveEventListener = (evt: PointerEvent) =>
                this.handlePointerCancel(evt)),
        );
    }

    handlePointerDown(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        this.pointerDown = true;
        this.clientXstart = this.clientX = evt.clientX;
        this.clientYstart = this.clientY = evt.clientY;
        this.startTimestamp = this.previousTimestamp = evt.timeStamp;
        evt.preventDefault();
    }

    handlePointerMove(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        if (!this.pointerDown && !this.dragging) return;
        const dtime = evt.timeStamp - this.previousTimestamp;
        this.previousTimestamp = evt.timeStamp;
        if (this.pointerDown && !this.dragging) {
            this.element.setPointerCapture(evt.pointerId);
            const dxTotal = evt.clientX - this.clientXstart;
            const dyTotal = evt.clientY - this.clientYstart;
            if (
                (dxTotal !== 0 || dyTotal !== 0) &&
                Math.hypot(dxTotal, dyTotal) > DRAG_START_THRESHOLD
            ) {
                this.dragging = true;
                if (this.onDragStart) {
                    this.onDragStart(
                        new DragHandlerEvent(
                            "dragstart",
                            evt,
                            this.element,
                            this,
                            0,
                            0,
                            dtime,
                        ),
                    );
                }
            }
        }
        if (!this.dragging) {
            return;
        }
        const dx = evt.clientX - this.clientX;
        const dy = evt.clientY - this.clientY;
        if (
            this.dragging &&
            (dx !== 0 || dy !== 0) &&
            Math.hypot(dx, dy) > DRAG_MOVE_THRESHOLD
        ) {
            if (this.onDragMove) {
                this.onDragMove(
                    new DragHandlerEvent(
                        "dragmove",
                        evt,
                        this.element,
                        this,
                        dx,
                        dy,
                        dtime,
                    ),
                );
            }
            this.clientX = evt.clientX;
            this.clientY = evt.clientY;
        }
        evt.preventDefault();
    }

    handlePointerUp(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        const dx = evt.clientX - this.clientX!;
        const dy = evt.clientY - this.clientY!;
        const dxTotal = evt.clientX - this.clientXstart;
        const dyTotal = evt.clientY - this.clientYstart;
        this.pointerDown = false;
        if (this.dragging) {
            this.dragging = false;
            if (this.onDragEnd) {
                this.onDragEnd(
                    new DragHandlerEvent(
                        "dragend",
                        evt,
                        this.element,
                        this,
                        dx,
                        dy,
                    ),
                );
            }
        }
        if (Math.hypot(dxTotal, dyTotal) < MAX_TAP_THRESHOLD) {
            if (this.onTap) {
                this.onTap(
                    new DragHandlerEvent("tap", evt, this.element, this),
                );
            }
        }
        evt.preventDefault();
        this.element.releasePointerCapture(evt.pointerId);
    }

    handlePointerCancel(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        this.pointerDown = false;
        if (this.dragging) {
            this.dragging = false;
            if (this.onDragEnd) {
                this.onDragEnd(
                    new DragHandlerEvent(
                        "dragend",
                        evt,
                        this.element,
                        this,
                        evt.clientX - this.clientX,
                        evt.clientY - this.clientY,
                    ),
                );
            }
        }
        evt.preventDefault();
        this.element.releasePointerCapture(evt.pointerId);
    }

    destroy() {
        this.element.removeEventListener(
            "pointerdown",
            this.pointerDownEventListener,
        );
        this.element.removeEventListener(
            "pointermove",
            this.pointerMoveEventListener,
        );
        this.element.removeEventListener(
            "pointerup",
            this.pointerUpEventListener,
        );
        this.element.removeEventListener(
            "pointercancel",
            this.pointerCancelEventListener,
        );
        this.element.removeEventListener(
            "pointerleave",
            this.pointerLeaveEventListener,
        );
    }
}
