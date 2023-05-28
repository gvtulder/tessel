import type { DragEvent } from '@interactjs/types';

import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';



export class PatternEditorGridDisplay extends GridDisplay {
    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
    }
}
