/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Command } from "./Command";

export class CommandHistory extends EventTarget {
    history: Command[];
    future: Command[];
    callback?: () => void;

    constructor(callback?: () => void) {
        super();
        this.history = [];
        this.future = [];
        this.callback = callback;
    }

    push(command: Command): void {
        this.history.push(command);
        this.future = [];
        if (this.callback) this.callback();
    }

    undo(): boolean {
        const command = this.history.pop();
        if (!command) return false;
        this.future.push(command);
        command.undo();
        if (this.callback) this.callback();
        return true;
    }

    redo(): boolean {
        const command = this.future.pop();
        if (!command) return false;
        this.history.push(command);
        command.execute();
        if (this.callback) this.callback();
        return true;
    }

    reset(): void {
        this.history = [];
        this.future = [];
        if (this.callback) this.callback();
    }

    get canUndo(): boolean {
        return this.history.length > 0;
    }

    get canRedo(): boolean {
        return this.future.length > 0;
    }
}
