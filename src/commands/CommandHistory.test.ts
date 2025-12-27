/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test, vitest } from "vitest";
import { CommandHistory } from "./CommandHistory";
import { Command } from "./Command";
import { PRNG } from "../geom/RandomSampler";
import { Shape } from "../grid/Shape";

class MockCommand extends Command {
    execute(prng?: PRNG): void {}
    undo(): void {}
    save(shapeMap: readonly Shape[]) {}
}

describe("CommandHistory", () => {
    test("basic functionality", () => {
        const callback = vitest.fn(() => {});
        const mockCommand1 = vitest.mockObject(new MockCommand());
        const mockCommand2 = vitest.mockObject(new MockCommand());
        const mockCommand3 = vitest.mockObject(new MockCommand());

        const history = new CommandHistory(callback);
        expect(history.history.length).toBe(0);
        expect(history.future.length).toBe(0);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
        history.push(mockCommand1);
        expect(history.history.length).toBe(1);
        expect(history.future.length).toBe(0);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);
        history.push(mockCommand2);
        expect(history.history.length).toBe(2);
        expect(history.undo()).toBe(true);
        expect(mockCommand2.undo).toHaveBeenCalledOnce();
        expect(history.history.length).toBe(1);
        expect(history.future.length).toBe(1);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(true);
        expect(history.redo()).toBe(true);
        expect(mockCommand2.execute).toHaveBeenCalledOnce();
        expect(history.undo()).toBe(true);
        expect(mockCommand2.undo).toHaveBeenCalledTimes(2);
        expect(history.undo()).toBe(true);
        expect(mockCommand1.undo).toHaveBeenCalledTimes(1);
        expect(history.history.length).toBe(0);
        expect(history.future.length).toBe(2);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(true);
        expect(history.undo()).toBe(false);
        expect(history.redo()).toBe(true);
        history.push(mockCommand3);
        expect(history.history.length).toBe(2);
        expect(history.future.length).toBe(0);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);
        expect(history.redo()).toBe(false);
        history.reset();
        expect(history.history.length).toBe(0);
        expect(history.future.length).toBe(0);
        expect(callback).toHaveBeenCalledTimes(9);
    });
});
