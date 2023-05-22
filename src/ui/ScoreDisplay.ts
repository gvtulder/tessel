
export class ScoreDisplay {
    element : HTMLDivElement;
    scoreField : HTMLSpanElement;
    private _points : number;

    constructor() {
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

        div.addEventListener('animationend', () => {
            this.element.classList.remove('animate');
        });
    }

    set points(points : number) {
        if (this._points != points) {
            this.scoreField.innerHTML = `${points}`;
            this._points = points;
            this.element.classList.add('animate');
        }
    }
}
