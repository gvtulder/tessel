import { Grid } from "./Grid";
import { PRNG, RandomSampler, selectRandom } from "./RandomSampler";
import { ColorPattern, Shape } from "./Shape";
import { Tile, TileColor, TileColors, TileSegment } from "./Tile";

type ColorGroup = Set<TileSegment>;

export class GridColoring {
    grid: Grid;
    groups: Set<ColorGroup>;
    segmentToGroup: Map<TileSegment, ColorGroup>;

    constructor(grid: Grid) {
        this.grid = grid;
        this.groups = new Set<ColorGroup>();
        this.segmentToGroup = new Map<TileSegment, ColorGroup>();

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
                    if (constraint.different.length != 0) {
                        throw new Error(
                            "different colors constraint not yet supported",
                        );
                    }
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
                }
            }
        }
    }

    applyColorPattern(
        colorPatterns: Map<Shape, ColorPattern[]>,
        prng: PRNG = Math.random,
    ) {
        const segmentToGroup = this.segmentToGroup;

        for (const tile of this.grid.tiles) {
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
                            const segment = tile.segments![s];
                            const group = segmentToGroup.get(segment)!;
                            mainGroup ||= group;
                            if (mainGroup !== group) {
                                this.mergeGroup(mainGroup, group);
                            }
                        }
                    }
                }
            }
        }
    }

    assignColors(
        colors: TileColors,
        prng: PRNG = Math.random,
    ): Map<ColorGroup, TileColor> {
        const segmentToGroup = this.segmentToGroup;
        const groupToColor = new Map<ColorGroup, TileColor>();
        for (const group of this.groups) {
            groupToColor.set(group, selectRandom(colors, prng())!);
        }
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
        for (const group of otherGroups) {
            for (const s of group) {
                target.add(s);
                segmentToGroup.set(s, target);
            }
            groups.delete(group);
        }
    }
}
