/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export interface StorageI {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

class LocalStorageAsStorage implements StorageI {
    async getItem(key: string): Promise<string | null> {
        return localStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }
}

let storageBackend: StorageI = new LocalStorageAsStorage();

export function getStorageBackend(): StorageI {
    return storageBackend;
}

export function setStorageBackend(backend: StorageI): void {
    storageBackend = backend;
}
