import { Grid } from "./Grid";
import {
    PRNG,
    RandomSampler,
    selectRandom,
    shuffle,
} from "../geom/RandomSampler";
import { ColorPattern, Shape } from "./Shape";
import { Tile, TileColor, TileColors, TileSegment } from "./Tile";

type ColorGroup = Set<TileSegment>;

export class GridColoring {
    grid: Grid;
    groups: Set<ColorGroup>;
    segmentToGroup: Map<TileSegment, ColorGroup>;
    conflicts: Map<ColorGroup, Set<ColorGroup>>;

    constructor(grid: Grid) {
        this.grid = grid;
        this.groups = new Set<ColorGroup>();
        this.segmentToGroup = new Map<TileSegment, ColorGroup>();
        this.conflicts = new Map<ColorGroup, Set<ColorGroup>>();

        this.computeColorGroups();
    }

    computeColorGroups() {
        const rules = this.grid.rules;

        const segmentToGroup = this.segmentToGroup;
        const groups = this.groups;

        for (const tile of this.grid.tiles) {
            if (tile.segments) {
                for (const segment of tile.segments) {
                    const constraint = rules.computeColorConstraints(segment);

                    // find the group for this segment, if any
                    let mainGroup = segmentToGroup.get(segment);
                    // find the groups for linked segments
                    const newSegments = mainGroup ? [] : [segment];
                    for (const other of constraint.same) {
                        const group = segmentToGroup.get(other);
                        if (!group) {
                            // assign a group to this segment at the end
                            newSegments.push(other);
                        } else if (group !== mainGroup) {
                            // this segment is assigned to the wrong group
                            if (mainGroup) {
                                // merge this with the main group
                                this.mergeGroup(mainGroup, group);
                            } else {
                                // use this segment's group as the main group
                                mainGroup = group;
                            }
                        }
                    }
                    // create a new group if necessary
                    if (!mainGroup) {
                        mainGroup = new Set<TileSegment>();
                        groups.add(mainGroup);
                    }
                    // assign all unlabeled segments to the group
                    for (const s of newSegments) {
                        mainGroup.add(s);
                        segmentToGroup.set(s, mainGroup);
                    }

                    // update conflicts
                    for (const other of constraint.different) {
                        let group = segmentToGroup.get(other);
                        if (!group) {
                            group = new Set<TileSegment>();
                            groups.add(group);
                            group.add(other);
                            segmentToGroup.set(other, group);
                        }
                        this.addConflict(mainGroup, group);
                        this.addConflict(group, mainGroup);
                    }
                }
            }
        }
    }

    applyColorPattern(
        colorPatterns: Map<Shape, ColorPattern[]>,
        uniqueTileColors: boolean,
        prng: PRNG = Math.random,
    ) {
        const segmentToGroup = this.segmentToGroup;

        for (const tile of this.grid.tiles) {
            if (!tile.segments) {
                throw new Error("tile has no segments");
            }
            // find the available color patterns for this tile shape
            const patterns = colorPatterns.get(tile.shape);
            if (!patterns || patterns.length == 0) {
                throw new Error(`No pattern defined for shape.`);
            }
            // pick a random pattern
            const pattern = selectRandom(patterns, prng())!;
            // pick a random rotation of the pattern
            const segmentColors = selectRandom(pattern.segmentColors, prng())!;
            // use this pattern to merge groups
            // unless each segment has a unique color
            if (pattern.numColors < segmentColors.length) {
                for (let c = 0; c < pattern.numColors; c++) {
                    let mainGroup;
                    for (let s = 0; s < segmentColors.length; s++) {
                        if (segmentColors[s] == c) {
                            const segment = tile.segments[s];
                            const group = segmentToGroup.get(segment)!;
                            mainGroup ||= group;
                            if (mainGroup !== group) {
                                this.mergeGroup(mainGroup, group);
                            }
                        }
                    }
                }
            }
            if (uniqueTileColors) {
                // add conflicts between internal segments
                for (const a of tile.segments) {
                    const groupA = segmentToGroup.get(a)!;
                    for (const b of tile.segments) {
                        const groupB = segmentToGroup.get(b)!;
                        if (a !== b) {
                            this.addConflict(groupA, groupB);
                        }
                    }
                }
            }
        }
    }

    assignColors(
        colors: TileColors,
        prng: PRNG = Math.random,
    ): Map<ColorGroup, TileColor> | null {
        const segmentToGroup = this.segmentToGroup;
        const groupToColor = new Map<ColorGroup, TileColor>();
        const colorsCopy = [...colors];

        // assign a color to each group
        for (const group of this.groups) {
            shuffle(colorsCopy, prng);
            let assignedColor = false;
            for (let i = 0; !assignedColor && i < colorsCopy.length; i++) {
                // check conflicts
                let conflict = false;
                for (const g of this.conflicts.get(group) || []) {
                    const c = groupToColor.get(g);
                    if (c == colorsCopy[i]) {
                        conflict = true;
                        break;
                    }
                }
                if (!conflict) {
                    groupToColor.set(group, colorsCopy[i]);
                    assignedColor = true;
                }
            }
            if (!assignedColor) {
                return null;
            }
        }

        // apply colors to tiles
        for (const tile of this.grid.tiles) {
            tile.colors = tile.segments!.map(
                (s) => groupToColor.get(segmentToGroup.get(s)!)!,
            );
        }

        return groupToColor;
    }

    private mergeGroup(target: ColorGroup, ...otherGroups: ColorGroup[]) {
        const segmentToGroup = this.segmentToGroup;
        const groups = this.groups;
        const conflicts = this.conflicts;
        for (const group of otherGroups) {
            // add segments to target group
            for (const s of group) {
                target.add(s);
                segmentToGroup.set(s, target);
            }
            // merge conflicts
            for (const conflictGroup of conflicts.get(group) || []) {
                this.addConflict(target, conflictGroup);
                this.addConflict(conflictGroup, target);
                conflicts.get(conflictGroup)!.delete(group);
            }
            // cleanup
            conflicts.delete(group);
            groups.delete(group);
        }
    }

    private addConflict(a: ColorGroup, b: ColorGroup) {
        const conflicts = this.conflicts;
        let conflictSetA = conflicts.get(a);
        if (!conflictSetA) {
            conflictSetA = new Set<ColorGroup>();
            conflicts.set(a, conflictSetA);
        }
        conflictSetA.add(b);
        let conflictSetB = conflicts.get(b);
        if (!conflictSetB) {
            conflictSetB = new Set<ColorGroup>();
            conflicts.set(b, conflictSetB);
        }
        conflictSetB.add(a);
    }
}
