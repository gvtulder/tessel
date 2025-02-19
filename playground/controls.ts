import { SVGDisplay } from "./svg_helpers";

export class Controls {
    constructor() {
        const div = document.createElement("div");
        div.classList.add("controls");

        for (const key of SVGDisplay.GROUPS) {
            const label = document.createElement("label");
            div.appendChild(label);
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
        div.appendChild(label);
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
}
