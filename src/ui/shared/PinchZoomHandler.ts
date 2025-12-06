/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

//
// Some parts of this code are based on or inspired by PinchZoom.js by
// Manuel Stofer (mst@rtp.ch), version 2.3.5, published under the MIT license
// at https://github.com/manuelstofer/pinchzoom
//

import { dist, midpoint, Point } from "../../geom/math";

export interface ScalableDisplay {
    scaleZoomFactor(scale: number, newZoomCenter?: Point): void;
    updateZoomFactor(newZoomFactor: number, newZoomCenter?: Point): void;
    handleDoubleTap(zoomCenter: Point): void;
    handleZoomStart(zoomCenter: Point): void;
    handleZoomEnd(): void;
    addDragOffset(dx: number, dy: number, interaction?: "zoom" | "drag"): void;
    handleDragEnd(): void;
}

const touchToPoint = (t: { pageX: number; pageY: number }) => ({
    x: t.pageX,
    y: t.pageY,
});
const touchesToPoints = (touches: TouchList) => {
    return [...touches].map(touchToPoint);
};

export class PinchZoomHandler {
    element: HTMLElement;
    scalableDisplay: ScalableDisplay;

    touchStartEventListener: (evt: TouchEvent) => void;
    touchMoveEventListener: (evt: TouchEvent) => void;
    touchEndEventListener: (evt: TouchEvent) => void;
    wheelEventListener: (evt: WheelEvent) => void;
    mouseDownEventListener: (evt: MouseEvent) => void;
    mouseMoveEventListener: (evt: MouseEvent) => void;
    mouseUpEventListener: (evt: MouseEvent) => void;

    nthZoom: number;
    lastScale: number;
    lastDragPosition: Point | null;
    isDoubleTap: boolean;

    constructor(element: HTMLElement, scalableDisplay: ScalableDisplay) {
        this.element = element;
        this.scalableDisplay = scalableDisplay;

        this.nthZoom = 0;
        this.lastScale = 1;
        this.lastDragPosition = null;

        let fingers = 0;
        let firstMove = true;
        let interaction: "zoom" | "drag" | null = null;
        let startTouches: Point[] = [];
        let lastTouchStart: number = 0;
        this.isDoubleTap = false;

        const updateInteraction = (evt: TouchEvent | MouseEvent) => {
            let newInteraction: typeof interaction;
            if (fingers === 2) {
                newInteraction = "zoom";
            } else if (fingers === 1) {
                newInteraction = "drag";
            } else {
                newInteraction = null;
            }

            if (interaction !== newInteraction) {
                switch (interaction) {
                    case "zoom":
                        this.handleZoomEnd(evt);
                        break;
                    case "drag":
                        this.handleDragEnd(evt);
                        break;
                }

                interaction = newInteraction;

                switch (interaction) {
                    case "zoom":
                        this.handleZoomStart(evt as TouchEvent);
                        break;
                    case "drag":
                        this.handleDragStart(evt);
                        break;
                }
            }
        };

        const detectDoubleTap = (evt: TouchEvent) => {
            const time = new Date().getTime();
            if (fingers > 1) {
                lastTouchStart = 0;
            }
            if (time - lastTouchStart < 300) {
                evt.stopPropagation();
                evt.preventDefault();
                this.handleDoubleTap(evt);
                switch (interaction) {
                    case "zoom":
                        this.handleZoomEnd(evt);
                        interaction = null;
                        break;
                    case "drag":
                        this.handleDragEnd(evt);
                        interaction = null;
                        break;
                }
            } else {
                this.isDoubleTap = false;
            }
            if (fingers === 1) {
                lastTouchStart = time;
            }
        };

        element.addEventListener(
            "touchstart",
            (this.touchStartEventListener = (evt: TouchEvent) => {
                fingers = evt.touches.length;
                firstMove = true;
                detectDoubleTap(evt);
            }),
            { passive: false },
        );
        element.addEventListener(
            "touchmove",
            (this.touchMoveEventListener = (evt: TouchEvent) => {
                if (!this.isDoubleTap) {
                    if (firstMove) {
                        updateInteraction(evt);
                        startTouches = touchesToPoints(evt.touches);
                        firstMove = false;
                    } else {
                        switch (interaction) {
                            case "zoom":
                                if (
                                    startTouches?.length == 2 &&
                                    evt.touches.length == 2
                                ) {
                                    this.handleZoom(
                                        evt,
                                        startTouches,
                                        touchesToPoints(evt.touches),
                                    );
                                }
                                break;
                            case "drag":
                                this.handleDrag(evt);
                                break;
                        }
                        if (interaction) {
                            evt.stopPropagation();
                            evt.preventDefault();
                        }
                    }
                }
            }),
            { passive: false },
        );
        element.addEventListener(
            "touchend",
            (this.touchEndEventListener = (evt: TouchEvent) => {
                fingers = evt.touches.length;
                updateInteraction(evt);
            }),
            { passive: false },
        );

        element.addEventListener(
            "wheel",
            (this.wheelEventListener = (evt: WheelEvent) => {
                const newScale =
                    this.lastScale * (1 - Math.sign(evt.deltaY) * 0.5);
                const scale = newScale / this.lastScale;
                this.scalableDisplay.handleZoomStart(touchToPoint(evt));
                this.scalableDisplay.scaleZoomFactor(scale, touchToPoint(evt));
                this.scalableDisplay.handleZoomEnd();
                this.lastScale = newScale;
            }),
            { passive: false },
        );
        element.addEventListener(
            "mousedown",
            (this.mouseDownEventListener = (evt: MouseEvent) => {
                fingers = 1;
                firstMove = true;
            }),
            { passive: true },
        );
        element.addEventListener(
            "mousemove",
            (this.mouseMoveEventListener = (evt: MouseEvent) => {
                if (fingers === 0) return;
                if (!this.isDoubleTap) {
                    if (firstMove) {
                        updateInteraction(evt);
                        startTouches = [touchToPoint(evt)];
                        firstMove = false;
                    } else {
                        if (interaction == "drag") {
                            this.handleDrag(evt);
                        }
                        if (interaction) {
                            evt.stopPropagation();
                            evt.preventDefault();
                        }
                    }
                }
            }),
            { passive: false },
        );
        element.addEventListener(
            "mouseup",
            (this.mouseUpEventListener = (evt: MouseEvent) => {
                fingers = 0;
                updateInteraction(evt);
            }),
            { passive: true },
        );
    }

    handleDoubleTap(evt: TouchEvent) {
        const zoomCenter = touchToPoint(evt.touches[0]);
        this.scalableDisplay.handleDoubleTap(zoomCenter);
    }

    handleZoomStart(evt: TouchEvent) {
        this.lastScale = 1;
        this.nthZoom = 0;
        const zoomCenter = midpoint(
            touchToPoint(evt.touches[0]),
            touchToPoint(evt.touches[1]),
        );
        this.scalableDisplay.handleZoomStart(zoomCenter);
    }

    handleZoom(
        evt: TouchEvent,
        startTouches: Point[],
        currentTouches: Point[],
    ) {
        const newScale =
            dist(currentTouches[0], currentTouches[1]) /
            dist(startTouches[0], startTouches[1]);
        const scale = newScale / this.lastScale;
        this.lastScale = newScale;
        const newZoomCenter = midpoint(currentTouches[0], currentTouches[1]);

        // the first touch events are thrown away since they are not precise
        this.nthZoom++;
        if (this.nthZoom > 3) {
            this.scaleZoomFactor(scale, newZoomCenter);
        }
    }

    handleZoomEnd(evt: TouchEvent | MouseEvent) {
        this.scalableDisplay.handleZoomEnd();
    }

    scaleZoomFactor(scale: number, newZoomCenter?: Point) {
        this.scalableDisplay.scaleZoomFactor(scale, newZoomCenter);
    }

    handleDragStart(evt: TouchEvent | MouseEvent) {
        this.lastDragPosition = null;
        this.handleDrag(evt);
    }

    handleDrag(evt: TouchEvent | MouseEvent) {
        const position = touchToPoint(
            evt.type === "touchmove"
                ? (evt as TouchEvent).touches[0]
                : (evt as PointerEvent),
        );
        if (!this.lastDragPosition) this.lastDragPosition = position;
        this.scalableDisplay.addDragOffset(
            position.x - this.lastDragPosition.x,
            position.y - this.lastDragPosition.y,
            "drag",
        );
        this.lastDragPosition = position;
    }

    handleDragEnd(evt: TouchEvent | MouseEvent) {
        this.lastDragPosition = null;
        this.scalableDisplay.handleDragEnd();
    }

    destroy() {
        this.element.removeEventListener(
            "touchstart",
            this.touchStartEventListener,
        );
        this.element.removeEventListener(
            "touchmove",
            this.touchMoveEventListener,
        );
        this.element.removeEventListener(
            "touchend",
            this.touchEndEventListener,
        );
        this.element.removeEventListener("wheel", this.wheelEventListener);
        this.element.removeEventListener(
            "mousedown",
            this.mouseDownEventListener,
        );
        this.element.removeEventListener(
            "mousemove",
            this.mouseMoveEventListener,
        );
        this.element.removeEventListener("mouseup", this.mouseUpEventListener);
    }
}
