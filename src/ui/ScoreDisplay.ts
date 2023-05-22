
export class ScoreDisplay {
    element : HTMLDivElement;
    scoreField : HTMLSpanElement;

    constructor() {
        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'scoreDisplay';
        this.element = div;

        const p = document.createElement('p');
        div.appendChild(p);

        const scoreField = document.createElement('span');
        p.appendChild(scoreField);
        this.scoreField = scoreField;
    }

    set points(points : number) {
        this.scoreField.innerHTML = `${points}`;
    }
}
