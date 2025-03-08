import { GridDisplay } from "../grid/GridDisplay";

export class OptionGridDisplay extends GridDisplay {
    // TODO scale based on area
    animated = true;
    margins = { top: 15, right: 15, bottom: 15, left: 15 };

    styleMainElement() {
        const div = this.element;
        div.className = "gameSetupOption-gridDisplay gridDisplay";
    }
}
