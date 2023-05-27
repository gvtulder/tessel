
export class ScoreDisplay {
    element : HTMLDivElement;
    scoreField : HTMLSpanElement;
    private _points : number;
    private onAnimationEnd : EventListener;

    constructor() {
        this.onAnimationEnd = () => {
            this.element.classList.remove('animate');
        };

        this.build();
        this._points = 0;
    }

    build() {
        const div = document.createElement('div');
        div.className = 'scoreDisplay';
        this.element = div;

        const p = document.createElement('p');
        div.appendChild(p);

        const scoreField = document.createElement('span');
        scoreField.innerHTML = '0';
        p.appendChild(scoreField);
        this.scoreField = scoreField;

        div.addEventListener('animationend', this.onAnimationEnd);
    }

    destroy() {
        this.element.removeEventListener('animationend', this.onAnimationEnd);
        this.element.remove();
    }

    set points(points : number) {
        if (this._points != points) {
            this.scoreField.innerHTML = `${points}`;
            this._points = points;
            this.element.classList.add('animate');
        }
    }
}
