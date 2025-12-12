/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { DestroyableEventListenerSet } from "../shared/DestroyableEventListenerSet";
import { createElement } from "../shared/html";
import icons from "../shared/icons";
import { TapHandler } from "../shared/TapHandler";

const AUTOPLAY_TAP_COUNT = 5;
const AUTOPLAY_TAP_TIME_LIMIT = 1000;
const AUTOPLAY_ACTIVE_TIME_LIMIT = 5000;

export class ScoreDisplay {
    element: HTMLDivElement;
    scoreField: HTMLSpanElement;
    tapHandler: TapHandler;
    onTapAutoPlay?: () => void;
    private _points: number;
    private _autoplayTapCount: number;
    private _autoplayTapTimeout?: number | null;
    private listeners: DestroyableEventListenerSet;

    constructor(highScore?: number) {
        this._points = 0;
        this._autoplayTapCount = 0;

        const element = (this.element = document.createElement("div"));
        element.className = "score";

        const p = createElement("p", "score-points", element);

        const scoreField = (this.scoreField = createElement("span", null, p));
        scoreField.innerHTML = "0";

        if (highScore) {
            const pHigh = createElement("p", "high-score", element);
            pHigh.innerHTML = icons.starIcon;
            const highScoreField = createElement("span", null, pHigh);
            highScoreField.innerHTML = `${highScore}`;
        }

        const robot = icons.robotIcon;

        this.tapHandler = new TapHandler(element);
        this.tapHandler.onTap = () => {
            if (this._autoplayTapTimeout)
                window.clearTimeout(this._autoplayTapTimeout);
            this._autoplayTapCount++;
            if (this._autoplayTapCount > AUTOPLAY_TAP_COUNT) {
                this.scoreField.innerHTML = `${this._points}`;
                this._autoplayTapCount = 0;
                if (this.onTapAutoPlay) this.onTapAutoPlay();
            } else if (this._autoplayTapCount == AUTOPLAY_TAP_COUNT) {
                this.scoreField.innerHTML = robot;
                this._autoplayTapTimeout = window.setTimeout(() => {
                    this.scoreField.innerHTML = `${this._points}`;
                    this._autoplayTapCount = 0;
                    this._autoplayTapTimeout = null;
                }, AUTOPLAY_ACTIVE_TIME_LIMIT);
            } else {
                this._autoplayTapTimeout = window.setTimeout(() => {
                    this._autoplayTapCount = 0;
                    this._autoplayTapTimeout = null;
                }, AUTOPLAY_TAP_TIME_LIMIT);
            }
        };

        this.listeners = new DestroyableEventListenerSet();
        this.listeners.addEventListener(element, "animationend", () =>
            this.element.classList.remove("animate"),
        );
    }

    destroy() {
        this.tapHandler.destroy();
        this.listeners.removeAll();
        this.element.remove();
    }

    set points(points: number) {
        if (this._points != points) {
            this.scoreField.innerHTML = `${points}`;
            this._points = points;
            this.element.classList.add("animate");
        }
    }
}
