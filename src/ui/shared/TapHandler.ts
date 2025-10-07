/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

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

    pressed: boolean;
    onStartPress?: (evt: TapHandlerEvent) => void;
    onEndPress?: (evt: TapHandlerEvent) => void;
    onTap?: (evt: TapHandlerEvent) => void;

    pointerDownEventListener: (evt: PointerEvent) => void;
    pointerUpEventListener: (evt: PointerEvent) => void;
    pointerOutEventListener: (evt: PointerEvent) => void;

    constructor(element: HTMLElement) {
        this.element = element;
        this.pressed = false;

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
        element.addEventListener(
            "pointerout",
            (this.pointerOutEventListener = (evt: PointerEvent) =>
                this.handlePointerOut(evt)),
        );
    }

    handlePointerDown(evt: PointerEvent) {
        this.pressed = true;
        if (this.onStartPress) {
            this.onStartPress(
                new TapHandlerEvent("startpress", evt, this.element, this),
            );
        }
        evt.preventDefault();
    }

    handlePointerUp(evt: PointerEvent) {
        if (this.pressed && this.onTap) {
            this.pressed = false;
            this.onTap(new TapHandlerEvent("tap", evt, this.element, this));
        }
        if (this.onEndPress) {
            this.onEndPress(
                new TapHandlerEvent("endpress", evt, this.element, this),
            );
        }
        evt.preventDefault();
    }

    handlePointerOut(evt: PointerEvent) {
        this.pressed = false;
        if (this.onEndPress) {
            this.onEndPress(
                new TapHandlerEvent("endpress", evt, this.element, this),
            );
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
        this.element.removeEventListener(
            "pointercancel",
            this.pointerOutEventListener,
        );
    }
}
