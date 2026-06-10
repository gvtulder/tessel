/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import * as zod from "zod/v4-mini";
import { Command } from "../commands/Command";
import { StorageI } from "../lib/storage-backend";
import { StatisticsEvent } from "./Events";

type StatisticsEventCounter = Map<StatisticsEvent | string, number>;

const STORAGE_KEY = "statistics";
const STORAGE_DELAY = 200;

export class StatisticsMonitor {
    static #instance: StatisticsMonitor;

    #storage?: StorageI;
    counters: StatisticsEventCounter;
    #storageUpdateTimeout?: number;

    constructor() {
        this.counters = new Map<StatisticsEvent, number>();
    }

    set storageBackend(backend: StorageI) {
        this.#storage = backend;
        if (backend) {
            backend.getItem(STORAGE_KEY).then((value) => {
                if (value) {
                    this.unserialize(value);
                }
            });
        }
    }

    private writeToStorage() {
        if (this.#storageUpdateTimeout) {
            window.clearTimeout(this.#storageUpdateTimeout);
        }
        this.#storageUpdateTimeout = window.setTimeout(() => {
            if (this.#storage) {
                this.#storage.setItem(STORAGE_KEY, this.serialize());
            }
        }, STORAGE_DELAY);
    }

    serialize(): string {
        const values = {} as { [key: string]: number };
        for (const [key, value] of this.counters.entries()) {
            values[key] = value;
        }
        return JSON.stringify(values);
    }

    unserialize(json: string): void {
        try {
            const values = JSON.parse(json);
            for (const [key, value] of Object.entries(values)) {
                if (Number.isSafeInteger(value)) {
                    this.counters.set(key, value as number);
                }
            }
        } catch (error) {
            // invalid JSON
        }
    }

    static get instance() {
        if (!StatisticsMonitor.#instance) {
            StatisticsMonitor.#instance = new StatisticsMonitor();
        }
        return StatisticsMonitor.#instance;
    }

    static CountEvent_S = zod.object({
        command: zod.literal("StatisticsMonitor.CountEvent"),
        eventType: zod.enum(StatisticsEvent),
        subtype: zod.optional(zod.string()),
    });

    static CountEvent = class extends Command {
        stats: StatisticsMonitor;
        eventType: StatisticsEvent;
        subtype?: string;

        constructor(
            stats: StatisticsMonitor,
            eventType: StatisticsEvent,
            subtype?: string,
        ) {
            super();
            this.stats = stats;
            this.eventType = eventType;
            this.subtype = subtype;
        }

        execute(): void {
            this.update(this.eventType);
            if (this.subtype) {
                this.update(`${this.eventType}.${this.subtype}`);
            }
        }

        undo(): void {
            this.update(this.eventType, -1);
            if (this.subtype) {
                this.update(`${this.eventType}.${this.subtype}`, -1);
            }
        }

        private update(key: string, delta: number = 1) {
            this.stats.counters.set(
                key,
                (this.stats.counters.get(key) || 0) + delta,
            );
            this.stats.writeToStorage();
        }

        save(): zod.infer<typeof StatisticsMonitor.CountEvent_S> {
            return {
                command: "StatisticsMonitor.CountEvent",
                eventType: this.eventType,
                subtype: this.subtype,
            };
        }
    };

    restoreCountEventCommand(
        d: zod.infer<typeof StatisticsMonitor.CountEvent_S>,
    ): Command {
        return new StatisticsMonitor.CountEvent(this, d.eventType, d.subtype);
    }

    countEvent(eventType: StatisticsEvent, subtype?: string): Command {
        const command = new StatisticsMonitor.CountEvent(
            this,
            eventType,
            subtype,
        );
        command.execute();
        return command;
    }

    static UpdateHighScore_S = zod.object({
        command: zod.literal("StatisticsMonitor.UpdateHighScore"),
        eventType: zod.enum(StatisticsEvent),
        value: zod.int(),
        subtype: zod.optional(zod.string()),
    });

    static UpdateHighScore = class extends Command {
        stats: StatisticsMonitor;
        eventType: StatisticsEvent;
        value: number;
        subtype: string | undefined;

        memo?: {
            mainValue?: number;
            subtypeValue?: number;
        };

        constructor(
            stats: StatisticsMonitor,
            eventType: StatisticsEvent,
            value: number,
            subtype?: string | undefined,
        ) {
            super();
            this.stats = stats;
            this.eventType = eventType;
            this.value = value;
            this.subtype = subtype;
        }

        execute(): void {
            const counters = this.stats.counters;
            const updateCounter = (eventKey: string) => {
                const currentValue = counters.get(eventKey);
                counters.set(eventKey, Math.max(this.value, currentValue || 0));
                return currentValue;
            };

            this.memo = {};
            this.memo.mainValue = updateCounter(this.eventType);
            if (this.subtype) {
                this.memo.subtypeValue = updateCounter(
                    `${this.eventType}.${this.subtype}`,
                );
            }

            this.stats.writeToStorage();
        }

        undo(): void {
            if (!this.memo) return;

            const counters = this.stats.counters;
            const restoreCounter = (eventKey: string, oldValue?: number) => {
                if (oldValue === undefined) {
                    counters.delete(eventKey);
                } else {
                    counters.set(eventKey, oldValue);
                }
            };

            restoreCounter(this.eventType, this.memo.mainValue);
            if (this.subtype) {
                restoreCounter(
                    `${this.eventType}.${this.subtype}`,
                    this.memo.subtypeValue,
                );
            }

            this.stats.writeToStorage();
            this.memo = undefined;
        }

        save(): zod.infer<typeof StatisticsMonitor.UpdateHighScore_S> {
            return {
                command: "StatisticsMonitor.UpdateHighScore",
                eventType: this.eventType,
                value: this.value,
                subtype: this.subtype,
            };
        }
    };

    restoreUpdateHighScoreCommand(
        d: zod.infer<typeof StatisticsMonitor.UpdateHighScore_S>,
    ): Command {
        return new StatisticsMonitor.UpdateHighScore(
            this,
            d.eventType,
            d.value,
            d.subtype,
        );
    }

    updateHighScore(
        eventType: StatisticsEvent,
        value: number,
        subtype?: string,
    ): Command {
        const command = new StatisticsMonitor.UpdateHighScore(
            this,
            eventType,
            value,
            subtype,
        );
        command.execute();
        return command;
    }
}
