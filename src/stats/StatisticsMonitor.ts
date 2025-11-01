/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

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

    private constructor() {
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

    private increment(key: string) {
        this.counters.set(key, (this.counters.get(key) || 0) + 1);
        this.writeToStorage();
    }

    private updateMax(key: string, value: number) {
        this.counters.set(key, Math.max(value, this.counters.get(key) || 0));
        this.writeToStorage();
    }

    countEvent(eventType: StatisticsEvent, subtype?: string) {
        this.increment(eventType);
        if (subtype) {
            this.increment(`${eventType}.${subtype}`);
        }
    }

    updateHighScore(
        eventType: StatisticsEvent,
        value: number,
        subtype?: string,
    ) {
        this.updateMax(eventType, value);
        if (subtype) {
            this.updateMax(`${eventType}.${subtype}`, value);
        }
    }
}
