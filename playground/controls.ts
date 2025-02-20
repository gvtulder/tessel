import { SVGDisplay } from "./svg_helpers";

export class Controls {
    div: HTMLElement;
    customRow: HTMLElement;

    constructor() {
        const div = document.createElement("div");
        div.classList.add("controls");
        this.div = div;

        const row = document.createElement("div");
        row.classList.add("row");
        div.appendChild(row);

        for (const key of SVGDisplay.GROUPS) {
            const label = document.createElement("label");
            row.appendChild(label);
            const input = document.createElement("input");
            input.type = "checkbox";
            label.appendChild(input);
            label.appendChild(document.createTextNode(key));

            const handleState = () => {
                document.body.classList.toggle(`hide-${key}`, !input.checked);
                localStorage.setItem(
                    `playground-hide-${key}`,
                    input.checked ? "no" : "yes",
                );
            };
            input.addEventListener("change", handleState);
            input.checked =
                localStorage.getItem(`playground-hide-${key}`) != "yes";
            handleState();
        }

        const label = document.createElement("label");
        label.classList.add("title-query");
        row.appendChild(label);
        const input = document.createElement("input");
        input.type = "text";
        label.appendChild(input);

        document.addEventListener("mousemove", (evt) => {
            if (evt.target && (evt.target as any).getAttribute) {
                input.value = (evt.target as any).getAttribute("title");
            }
        });

        document.body.appendChild(div);
    }

    addSelect(
        callback: (key: string) => void,
        options: { key: string; text: string }[],
        title?: string,
    ) {
        if (!this.customRow) {
            const row = document.createElement("div");
            row.classList.add("row");
            this.customRow = row;
            this.div.appendChild(this.customRow);
        }

        const select = document.createElement("select");
        for (const item of options) {
            const option = document.createElement("option");
            option.value = item.key;
            option.appendChild(document.createTextNode(item.text));
            select.appendChild(option);
        }
        const label = document.createElement("label");
        if (title) {
            label.appendChild(document.createTextNode(title));
        }
        select.addEventListener("change", () => callback(select.value));
        label.appendChild(select);
        this.customRow.appendChild(label);
    }
}
