/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test, vi } from "vitest";
import {
    getStorageBackend,
    setStorageBackend,
    StorageI,
} from "./storage-backend";

class MockBackend implements StorageI {
    variables: Map<string, string>;

    constructor() {
        this.variables = new Map<string, string>();
    }

    async getItem(key: string): Promise<string | null> {
        return this.variables.get(key) || null;
    }

    setItem(key: string, value: string): void {
        this.variables.set(key, value);
    }

    removeItem(key: string): void {
        this.variables.delete(key);
    }
}

describe("LocalStorageAsStorage", () => {
    test("can read and write", async () => {
        const storageBackend = getStorageBackend();
        expect(await storageBackend.getItem("example")).toBeNull();
        storageBackend.setItem("example", "12345");
        expect(await storageBackend.getItem("example")).toEqual("12345");
        storageBackend.setItem("example", "54321");
        expect(await storageBackend.getItem("example")).toEqual("54321");
        storageBackend.removeItem("example");
        expect(await storageBackend.getItem("example")).toBeNull();
        storageBackend.removeItem("example");
        expect(await storageBackend.getItem("example")).toBeNull();
    });

    test("can set an alternative backend", async () => {
        const mock = new MockBackend();
        const getItemSpy = vi.spyOn(mock, "getItem");
        const setItemSpy = vi.spyOn(mock, "setItem");
        const removeItemSpy = vi.spyOn(mock, "removeItem");

        setStorageBackend(mock);
        const storageBackend = getStorageBackend();

        expect(await storageBackend.getItem("example")).toBeNull();
        expect(getItemSpy).toHaveBeenCalledTimes(1);
        storageBackend.setItem("example", "12345");
        expect(setItemSpy).toHaveBeenCalledTimes(1);
        expect(await storageBackend.getItem("example")).toEqual("12345");
        expect(getItemSpy).toHaveBeenCalledTimes(2);
        storageBackend.setItem("example", "54321");
        expect(setItemSpy).toHaveBeenCalledTimes(2);
        expect(await storageBackend.getItem("example")).toEqual("54321");
        expect(getItemSpy).toHaveBeenCalledTimes(3);
        storageBackend.removeItem("example");
        expect(removeItemSpy).toHaveBeenCalledTimes(1);
        expect(await storageBackend.getItem("example")).toBeNull();
        expect(getItemSpy).toHaveBeenCalledTimes(4);
        storageBackend.removeItem("example");
        expect(removeItemSpy).toHaveBeenCalledTimes(2);
        expect(await storageBackend.getItem("example")).toBeNull();
        expect(getItemSpy).toHaveBeenCalledTimes(5);
    });
});
