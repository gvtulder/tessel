/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { createElement } from "../shared/html";
import icons from "../shared/icons";

export class ScoreDisplay {
    element: HTMLDivElement;
    scoreField: HTMLSpanElement;
    private _points: number;
    private onScoreAnimationEnd: EventListener;

    constructor(highScore?: number) {
        this.onScoreAnimationEnd = () => {
            this.element.classList.remove("animate");
        };

        this._points = 0;

        const element = (this.element = document.createElement("div"));
        element.className = "score";

        const p = createElement("p", null, element);

        const scoreField = (this.scoreField = createElement("span", null, p));
        scoreField.innerHTML = "0";

        if (highScore) {
            const pHigh = createElement("p", "high-score", element);
            pHigh.innerHTML = icons.starIcon;
            const highScoreField = createElement("span", null, pHigh);
            highScoreField.innerHTML = `${highScore}`;
        }

        element.addEventListener("animationend", this.onScoreAnimationEnd);
    }

    destroy() {
        this.element.removeEventListener(
            "animationend",
            this.onScoreAnimationEnd,
        );
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
