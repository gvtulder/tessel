import { Tile, TileType } from "../grid/Tile.js";
import { ColorGroup, TileColors, Triangle, TriangleColor } from "../grid/Triangle.js";
import { Grid } from "./Grid.js";


export const COLORS = ['red', 'blue', 'white', 'black', 'green', 'orange', 'purple'];


export class EditableTile extends Tile {
    colorGroupsToColors : Map<ColorGroup, TriangleColor>;
    colorsToColorGroup : Map<ColorGroup, TriangleColor>;

    constructor(grid: Grid, triangles : Triangle[][]) {
        super(grid, TileType.EditableTile, triangles);
    }

    /**
     * Adds a triangle to the current tile.
     * 
     * If no color group is given, one is selected automatically.
     *
     * @param triangle the new triangle
     * @param colorGroup the color group for the triangle
     * @returns true if the triangle was added
     */
    addTriangle(triangle : Triangle, colorGroup? : ColorGroup) : boolean {
        // not already added
        if (this._triangles.has(triangle)) return false;

        // find a neighbor in the current shape
        const neighbor = triangle.getNeighbors().find(
            (n) => this._triangles.has(n)
        );
        // must be connected
        if (!neighbor) return false;

        if (!this.checkForHoles(triangle)) {
            console.log('would create a hole, not adding triangle');
            return false;
        }

        // ok, choose a color group
        if (colorGroup === null || colorGroup === undefined) {
            // use the one of the neighbor
            colorGroup = neighbor.colorGroup;
        }
        triangle.color = COLORS[colorGroup];
        triangle.colorGroup = colorGroup;
        this.doAddTriangle(triangle);

        return true;
    }

    /**
     * Check if adding the triangle would create a hole in the shape.
     * @param newTriangle the new triangle to add
     * @returns true if there are no holes
     */
    checkForHoles(newTriangle : Triangle) : boolean {
        // must not create a hole
        // - find the new frontier
        const newFrontier = new Set<Triangle>();
        for (const t of this.triangles) {
            for (const neighbor of t.getOrAddNeighbors()) {
                if (neighbor !== newTriangle && neighbor.tile !== this) {
                    newFrontier.add(neighbor);
                }
            }
        }
        // - add the new triangle
        for (const neighbor of newTriangle.getOrAddNeighbors()) {
            if (neighbor !== newTriangle && neighbor.tile !== this) {
                newFrontier.add(neighbor);
            }
        }
        // - make sure all triangles have a direct connection if possible
        const doubleFrontier = new Set<Triangle>(newFrontier);
        for (let i=0; i<5; i++) {
            for (const t of [...doubleFrontier]) {
                for (const neighbor of t.getOrAddNeighbors()) {
                    if (neighbor !== newTriangle && neighbor.tile !== this) {
                        doubleFrontier.add(neighbor);
                    }
                }
            }
        }
        // - check that all triangles are reachable
        const seen = new Set<Triangle>();
        const first = [...doubleFrontier.values()][0];
        seen.add(first);
        const queue : Triangle[] = [first];
        while (queue.length > 0) {
            const t = queue.pop();
            for (const neighbor of t.getNeighbors()) {
                if (!seen.has(neighbor) && doubleFrontier.has(neighbor)) {
                    queue.push(neighbor);
                    seen.add(neighbor);
                }
            }
        }
        // - should have seen all triangles
        console.log('check for holes', seen.size, doubleFrontier.size);
        return seen.size === doubleFrontier.size;
    }

    /**
     * Remove the triangle from the shape, if possible.
     *
     * @param triangle the triangle
     * @returns true if the removal was successful
     */
    removeTriangle(triangle : Triangle): boolean {
        // do not remove our last triangle
        if (this._triangles.size < 2) return false;

        // find neighbors inside the tile
        const neighborsInShape = triangle.getNeighbors().filter(
            (neighbor) => this._triangles.has(neighbor)
        );

        // is this a center triangle?
        if (neighborsInShape.length == 3) return false;

        // is this a vital connection to other triangles?
        // walk the triangles to check reachability
        const marked = new Set<Triangle>;
        const start = neighborsInShape[0];
        const queue: Triangle[] = [start];
        marked.add(start);
        while (queue.length > 0) {
            const t = queue.pop();
            // follow connections
            for (const n of t.getNeighbors()) {
                if (n !== triangle
                    && n.tile === this
                    && !marked.has(n)) {
                    queue.push(n);
                    marked.add(n);
                }
            }
        }
        // do we get unreachable triangles if we remove this?
        if (marked.size < this._triangles.size - 1) return false;

        // all ok, remove the tile
        this.doRemoveTriangle(triangle);

        return true;
    }

    /**
     * Rotates the color group of this triangle. If this is the only
     * triangle with the current color, the triangle will be changed
     * to one of the other colors.
     * @param triangle the triangle to update
     * @returns true if the tile had a unique color
     */
    rotateColorGroup(triangle : Triangle) : boolean {
        // is this the only tile in this colorgroup?
        let newColorGroup = triangle.colorGroup + 1;
        let wasUnique = false;
        if (this.triangles.filter((t) => t.colorGroup == triangle.colorGroup).length == 1) {
            // yes, rotate back to another color group
            newColorGroup = newColorGroup % this._colors.length;
            wasUnique = true;
        } else {
            // rotate, maybe start a new color group
            newColorGroup = newColorGroup % (this._colors.length + 1);
        }

        // update the color group
        this._triangles.set(triangle, newColorGroup);
        triangle.colorGroup = newColorGroup;
        if (!this._colors[newColorGroup]) {
            // find an unused color
            const newColors = [...this._colors];
            newColors[newColorGroup] = COLORS.find((c) => this._colors.indexOf(c) == -1);
            this._colors = newColors;
        }
        triangle.color = this._colors[triangle.colorGroup];
        this.recomputeColorGroups();

        return wasUnique;
    }

    /**
     * Sets the triangle color to the required color, adding a
     * new colorgroup if necessary.
     * @param triangle the triangle to update
     * @param color the new color
     */
    setTriangleColor(triangle : Triangle, color : TriangleColor) {
        let colorGroup = this._colors.indexOf(color);
        if (colorGroup === -1) {
            // new color
            const newColors = [...this._colors];
            newColors.push(color);
            colorGroup = this._colors.length;
            this._colors = newColors;
        }
        this._triangles.set(triangle, colorGroup);
        triangle.colorGroup = colorGroup;
        triangle.color = this._colors[triangle.colorGroup];
        this.recomputeColorGroups();
    }
}
