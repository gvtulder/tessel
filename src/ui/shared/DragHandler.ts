/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { DestroyableEventListenerSet } from "./DestroyableEventListenerSet";

export class DragHandlerEvent {
    event: PointerEvent;
    target: HTMLElement;
    handler: DragHandler;
    dx: number;
    dy: number;
    dxTotal: number;
    dyTotal: number;
    dtime: number;
    velocityX: number;
    velocityY: number;

    constructor(
        type: string,
        event: PointerEvent,
        target: HTMLElement,
        handler: DragHandler,
        dx: number = 0,
        dy: number = 0,
        dxTotal: number = 0,
        dyTotal: number = 0,
        dtime: number = 0,
        velocityX: number = 0,
        velocityY: number = 0,
    ) {
        this.event = event;
        this.target = target;
        this.handler = handler;
        this.dx = dx;
        this.dy = dy;
        this.dxTotal = dxTotal;
        this.dyTotal = dyTotal;
        this.dtime = dtime;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
}

const DRAG_START_THRESHOLD = 5;
const DRAG_MOVE_THRESHOLD = 0.5;
const MAX_TAP_THRESHOLD = 15;

const VELOCITY_MOVING_AVERAGE_DECAY = 0.99;

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
    velocityX = 0;
    velocityY = 0;

    onDragStart?: (evt: DragHandlerEvent) => void;
    onDragMove?: (evt: DragHandlerEvent) => void;
    onDragEnd?: (evt: DragHandlerEvent) => void;
    onTap?: (evt: DragHandlerEvent) => void;

    usePointerCapture?: boolean;
    pointerType?: string;
    listeners: DestroyableEventListenerSet;

    constructor(
        element: HTMLElement,
        usePointerCapture?: boolean,
        pointerType?: string,
    ) {
        this.element = element;
        this.usePointerCapture = usePointerCapture;
        this.pointerType = pointerType;

        this.listeners = new DestroyableEventListenerSet();

        this.listeners
            .forTarget(element)
            .addEventListener("pointerdown", (evt: PointerEvent) =>
                this.handlePointerDown(evt),
            )
            .addEventListener("pointermove", (evt: PointerEvent) =>
                this.handlePointerMove(evt),
            )
            .addEventListener("pointerup", (evt: PointerEvent) =>
                this.handlePointerUp(evt),
            )
            .addEventListener("pointercancel", (evt: PointerEvent) =>
                this.handlePointerCancel(evt),
            )
            .addEventListener("pointerleave", (evt: PointerEvent) =>
                this.handlePointerCancel(evt),
            );
    }

    handlePointerDown(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        if (this.pointerType && this.pointerType != evt.pointerType) return;
        this.pointerDown = true;
        this.clientXstart = this.clientX = evt.clientX;
        this.clientYstart = this.clientY = evt.clientY;
        this.startTimestamp = this.previousTimestamp = evt.timeStamp;
        this.velocityX = 0;
        this.velocityY = 0;
        evt.preventDefault();
    }

    handlePointerMove(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        if (this.pointerType && this.pointerType != evt.pointerType) return;
        if (!this.pointerDown && !this.dragging) return;
        const dtime = evt.timeStamp - this.previousTimestamp;
        this.previousTimestamp = evt.timeStamp;
        const dxTotal = evt.clientX - this.clientXstart;
        const dyTotal = evt.clientY - this.clientYstart;
        if (this.pointerDown && !this.dragging) {
            if (this.usePointerCapture) {
                this.element.setPointerCapture(evt.pointerId);
            }
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
                            dxTotal,
                            dyTotal,
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
        const decay = Math.pow(VELOCITY_MOVING_AVERAGE_DECAY, dtime);
        this.velocityX = (1 - decay) * dx + decay * this.velocityX;
        this.velocityY = (1 - decay) * dy + decay * this.velocityY;
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
                        dxTotal,
                        dyTotal,
                        dtime,
                        this.velocityX,
                        this.velocityY,
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
        if (this.pointerType && this.pointerType != evt.pointerType) return;
        const dtime = evt.timeStamp - this.previousTimestamp;
        const dx = evt.clientX - this.clientX!;
        const dy = evt.clientY - this.clientY!;
        const dxTotal = evt.clientX - this.clientXstart;
        const dyTotal = evt.clientY - this.clientYstart;
        const decay = Math.pow(VELOCITY_MOVING_AVERAGE_DECAY, dtime);
        this.velocityX = (1 - decay) * dx + decay * this.velocityX;
        this.velocityY = (1 - decay) * dy + decay * this.velocityY;
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
                        dxTotal,
                        dyTotal,
                        dtime,
                        this.velocityX,
                        this.velocityY,
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
        if (this.usePointerCapture) {
            this.element.releasePointerCapture(evt.pointerId);
        }
    }

    handlePointerCancel(evt: PointerEvent) {
        if (!evt.isPrimary) return;
        if (this.pointerType && this.pointerType != evt.pointerType) return;
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
                        0,
                        0,
                        this.clientX - this.clientXstart,
                        this.clientY - this.clientYstart,
                    ),
                );
            }
        }
        evt.preventDefault();
        if (this.usePointerCapture) {
            this.element.releasePointerCapture(evt.pointerId);
        }
    }

    destroy() {
        this.listeners.removeAll();
    }
}
