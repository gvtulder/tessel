/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { GridEdge } from "./GridEdge";
import { GridVertex } from "./GridVertex";
import { P } from "../geom/math";
import { TrianglesAtlas } from "./atlas/TrianglesAtlas";

const TRIANGLE = TrianglesAtlas.shapes[0];

describe("GridEdge", () => {
    const a = new GridVertex(P(0, 0));
    const b = new GridVertex(P(0, 1));

    test("can be constructed", () => {
        const edge = new GridEdge(a, b);
        expect(edge.a).toBe(a);
        expect(edge.b).toBe(b);
    });

    test("follows a standard order", () => {
        const edge = new GridEdge(b, a);
        expect(edge.a).toBe(a);
        expect(edge.b).toBe(b);
    });
});
