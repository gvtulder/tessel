/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

interface ForTarget {
    addEventListener<K extends keyof GlobalEventHandlersEventMap>(
        type: K,
        callback: (
            this: GlobalEventHandlers,
            ev: GlobalEventHandlersEventMap[K],
        ) => void,
        options?: boolean | AddEventListenerOptions,
    ): ForTarget;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean,
    ): ForTarget;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean,
    ): ForTarget;
}

export class DestroyableEventListenerSet {
    private listeners: [
        target: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ][];

    constructor() {
        this.listeners = [];
    }

    addEventListener<K extends keyof GlobalEventHandlersEventMap>(
        target: EventTarget,
        type: K,
        callback: (
            this: GlobalEventHandlers,
            ev: GlobalEventHandlersEventMap[K],
        ) => void,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        target: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        target: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void {
        target.addEventListener(type, callback, options);
        this.listeners.push([target, type, callback, options]);
    }

    forTarget(target: EventTarget): ForTarget {
        const chain: ForTarget = {
            addEventListener: (
                type: string,
                callback: EventListenerOrEventListenerObject | null,
                options?: boolean,
            ) => {
                this.addEventListener(target, type, callback, options);
                return chain;
            },
        };
        return chain;
    }

    removeEventListener<K extends keyof GlobalEventHandlersEventMap>(
        target: EventTarget,
        type: K,
        listener: (
            this: GlobalEventHandlers,
            ev: GlobalEventHandlersEventMap[K],
        ) => void,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        target: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
    removeEventListener(
        target: EventTarget,
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void {
        target.removeEventListener(type, callback as EventListener, options);
        this.listeners = this.listeners.filter(
            ([g, t, c, o]) => g !== target || t != type || c != callback,
        );
    }

    removeAll() {
        for (const [target, t, c, o] of this.listeners) {
            target.removeEventListener(t, c, o);
        }
        this.listeners = [];
    }
}
