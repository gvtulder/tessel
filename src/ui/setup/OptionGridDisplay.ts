import { GridDisplay } from "../grid/GridDisplay";

export class OptionGridDisplay extends GridDisplay {
    // TODO scale based on area
    animated = false;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };

    styleMainElement() {
        const div = this.element;
        div.className = "gameSetupOption-gridDisplay gridDisplay";
    }
}
