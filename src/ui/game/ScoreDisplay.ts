import { createElement } from "../shared/html";

export class ScoreDisplay {
    element: HTMLDivElement;
    scoreField: HTMLSpanElement;
    private _points: number;
    private onScoreAnimationEnd: EventListener;

    constructor() {
        this.onScoreAnimationEnd = () => {
            this.element.classList.remove("animate");
        };

        this._points = 0;

        const element = (this.element = document.createElement("div"));
        element.className = "score";

        const p = createElement("p", null, element);

        const scoreField = (this.scoreField = createElement("span", null, p));
        scoreField.innerHTML = "0";

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
