// TypeScript port of https://github.com/mapbox/lineclip/
// original code:
// ISC License
// Copyright (c) 2015, Mapbox

import { expect, test } from "@jest/globals";
import { lineclip, polygonclip } from "./lineclip";

test("clips line", () => {
    const result = lineclip(
        [
            { x: -10, y: 10 },
            { x: 10, y: 10 },
            { x: 10, y: -10 },
            { x: 20, y: -10 },
            { x: 20, y: 10 },
            { x: 40, y: 10 },
            { x: 40, y: 20 },
            { x: 20, y: 20 },
            { x: 20, y: 40 },
            { x: 10, y: 40 },
            { x: 10, y: 20 },
            { x: 5, y: 20 },
            { x: -10, y: 20 },
        ],
        { minX: 0, minY: 0, maxX: 30, maxY: 30 },
    );

    expect(result).toStrictEqual([
        [
            { x: 0, y: 10 },
            { x: 10, y: 10 },
            { x: 10, y: 0 },
        ],
        [
            { x: 20, y: 0 },
            { x: 20, y: 10 },
            { x: 30, y: 10 },
        ],
        [
            { x: 30, y: 20 },
            { x: 20, y: 20 },
            { x: 20, y: 30 },
        ],
        [
            { x: 10, y: 30 },
            { x: 10, y: 20 },
            { x: 5, y: 20 },
            { x: 0, y: 20 },
        ],
    ]);
});

test("clips line crossing through many times", () => {
    const result = lineclip(
        [
            { x: 10, y: -10 },
            { x: 10, y: 30 },
            { x: 20, y: 30 },
            { x: 20, y: -10 },
        ],
        { minX: 0, minY: 0, maxX: 20, maxY: 20 },
    );

    expect(result).toStrictEqual([
        [
            { x: 10, y: 0 },
            { x: 10, y: 20 },
        ],
        [
            { x: 20, y: 20 },
            { x: 20, y: 0 },
        ],
    ]);
});

test("clips polygon", () => {
    const result = polygonclip(
        [
            { x: -10, y: 10 },
            { x: 0, y: 10 },
            { x: 10, y: 10 },
            { x: 10, y: 5 },
            { x: 10, y: -5 },
            { x: 10, y: -10 },
            { x: 20, y: -10 },
            { x: 20, y: 10 },
            { x: 40, y: 10 },
            { x: 40, y: 20 },
            { x: 20, y: 20 },
            { x: 20, y: 40 },
            { x: 10, y: 40 },
            { x: 10, y: 20 },
            { x: 5, y: 20 },
            { x: -10, y: 20 },
        ],
        { minX: 0, minY: 0, maxX: 30, maxY: 30 },
    );

    expect(result).toStrictEqual([
        { x: 0, y: 10 },
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 5 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 30, y: 10 },
        { x: 30, y: 20 },
        { x: 20, y: 20 },
        { x: 20, y: 30 },
        { x: 10, y: 30 },
        { x: 10, y: 20 },
        { x: 5, y: 20 },
        { x: 0, y: 20 },
    ]);
});

test("appends result if passed third argument", () => {
    const arr = [];
    const result = lineclip(
        [
            { x: -10, y: 10 },
            { x: 30, y: 10 },
        ],
        { minX: 0, minY: 0, maxX: 20, maxY: 20 },
        arr,
    );

    expect(result).toStrictEqual([
        [
            { x: 0, y: 10 },
            { x: 20, y: 10 },
        ],
    ]);
    expect(result).toBe(arr);
});

test("clips floating point lines", () => {
    const line = [
        { x: -86.66015624999999, y: 42.22851735620852 },
        { x: -81.474609375, y: 38.51378825951165 },
        { x: -85.517578125, y: 37.125286284966776 },
        { x: -85.8251953125, y: 38.95940879245423 },
        { x: -90.087890625, y: 39.53793974517628 },
        { x: -91.93359375, y: 42.32606244456202 },
        { x: -86.66015624999999, y: 42.22851735620852 },
    ];

    const bbox = {
        minX: -91.93359375,
        minY: 42.29356419217009,
        maxX: -91.7578125,
        maxY: 42.42345651793831,
    };

    const result = lineclip(line, bbox);

    expect(result).toStrictEqual([
        [
            { x: -91.91208030440808, y: 42.29356419217009 },
            { x: -91.93359375, y: 42.32606244456202 },
            { x: -91.7578125, y: 42.3228109416169 },
        ],
    ]);
});

test("preserves line if no protrusions exist", () => {
    const result = lineclip(
        [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 },
        ],
        { minX: 0, minY: 0, maxX: 30, maxY: 30 },
    );

    expect(result).toStrictEqual([
        [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 },
        ],
    ]);
});

test("clips without leaving empty parts", () => {
    const result = lineclip(
        [
            { x: 40, y: 40 },
            { x: 50, y: 50 },
        ],
        { minX: 0, minY: 0, maxX: 30, maxY: 30 },
    );

    expect(result).toStrictEqual([]);
});

test("still works when polygon never crosses bbox", () => {
    const result = polygonclip(
        [
            { x: 3, y: 3 },
            { x: 5, y: 3 },
            { x: 5, y: 5 },
            { x: 3, y: 5 },
            { x: 3, y: 3 },
        ],
        { minX: 0, minY: 0, maxX: 2, maxY: 2 },
    );

    expect(result).toStrictEqual([]);
});
