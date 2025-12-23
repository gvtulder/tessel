/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Command } from "./Command";

/**
 * Models the undo/redo history.
 */
export class CommandHistory extends EventTarget {
    /**
     * The stack of commands that can be undone.
     */
    history: Command[];

    /**
     * The stack of commands that can be redone.
     */
    future: Command[];

    /**
     * Callback function to be called when the history state changes.
     */
    callback?: () => void;

    /**
     * Constructs a new command history.
     * @param callback a function to be called when the history state changes (undo, redo, a new command)
     */
    constructor(callback?: () => void) {
        super();
        this.history = [];
        this.future = [];
        this.callback = callback;
    }

    /**
     * Adds a command to the command history. This clears the redo list.
     * @param command the latest command
     */
    push(command: Command): void {
        this.history.push(command);
        this.future = [];
        if (this.callback) this.callback();
    }

    /**
     * Runs the undo function of the most recent command and moves this
     * to the redo future list.
     * @returns true if a command was undone, false if the undo history was empty
     */
    undo(): boolean {
        const command = this.history.pop();
        if (!command) return false;
        this.future.push(command);
        command.undo();
        if (this.callback) this.callback();
        return true;
    }

    /**
     * Re-executes the most recently undone command and moves this to
     * the undo history list.
     * @returns true if a command was redone, false if the redo history was empty
     */
    redo(): boolean {
        const command = this.future.pop();
        if (!command) return false;
        this.history.push(command);
        command.execute();
        if (this.callback) this.callback();
        return true;
    }

    /**
     * Clears the undo and redo stacks.
     */
    reset(): void {
        this.history = [];
        this.future = [];
        if (this.callback) this.callback();
    }

    /**
     * Returns true if the undo stack is not empty.
     */
    get canUndo(): boolean {
        return this.history.length > 0;
    }

    /**
     * Returns true if the redo stack is not empty.
     */
    get canRedo(): boolean {
        return this.future.length > 0;
    }
}
