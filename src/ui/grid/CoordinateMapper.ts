import { Point } from "../../geom/math";
import { SVG } from "../svg";

type ScreenToGridCoeff = {
    x0: number;
    y0: number;
    scale: number;
    dxdx: number;
    dydx: number;
    dxdy: number;
    dydy: number;
};

export class CoordinateMapper {
    svgGroup: SVGElement;
    svgUnitCircle00: SVGElement;
    svgUnitCircle01: SVGElement;
    svgUnitCircle10: SVGElement;

    private _coeffCache?: ScreenToGridCoeff;

    constructor() {
        const group = (this.svgGroup = SVG("g", "svg-CoordinateMapper"));

        // measurement circles
        this.svgUnitCircle00 = SVG("circle", null, group, {
            cx: "0",
            cy: "0",
            r: "0.0001",
            fill: "transparent",
        });

        this.svgUnitCircle01 = SVG("circle", null, group, {
            cx: "0",
            cy: "1",
            r: "0.0001",
            fill: "transparent",
        });

        this.svgUnitCircle10 = SVG("circle", null, group, {
            cx: "1",
            cy: "0",
            r: "0.0001",
            fill: "transparent",
        });
    }

    destroy() {
        this.svgGroup.remove();
    }

    resetCoeffCache() {
        this._coeffCache = undefined;
    }

    updateCoeffCache(dx: number, dy: number) {
        if (this._coeffCache) {
            this._coeffCache.x0 += dx;
            this._coeffCache.y0 += dy;
        }
    }

    private get coeff(): ScreenToGridCoeff {
        if (!this._coeffCache) {
            const rect00 = this.svgUnitCircle00.getBoundingClientRect();
            const rect01 = this.svgUnitCircle01.getBoundingClientRect();
            const rect10 = this.svgUnitCircle10.getBoundingClientRect();
            this._coeffCache = {
                x0: rect00.left,
                y0: rect00.top,
                scale: rect00.width / 2,
                dxdx: rect10.left - rect00.left,
                dydx: rect10.top - rect00.top,
                dxdy: rect01.left - rect00.left,
                dydy: rect01.top - rect00.top,
            };
        }
        return this._coeffCache;
    }

    gridToScreen(gridPos: Point): Point {
        const coeff = this.coeff;
        const x = gridPos.x;
        const y = gridPos.y;
        return {
            x: x * coeff.dxdx + y * coeff.dxdy + coeff.x0,
            y: x * coeff.dydx + y * coeff.dydy + coeff.y0,
        };
    }

    screenToGrid(screenPos: Point): Point {
        const coeff = this.coeff;
        const s = coeff.dydx * coeff.dxdy - coeff.dxdx * coeff.dydy;
        const x = (screenPos.x - coeff.x0) / s;
        const y = (screenPos.y - coeff.y0) / s;
        return {
            x: -x * coeff.dydy + y * coeff.dxdy,
            y: x * coeff.dydx - y * coeff.dxdx,
        };
    }
}
