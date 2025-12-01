/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { AutoPlayer } from "../../game/autoplayer/AutoPlayer";
import { dist } from "../../geom/math";
import { PRNG } from "../../geom/RandomSampler";
import { GameDisplay } from "./GameDisplay";

export class AnimatedAutoPlayer {
    gameDisplay: GameDisplay;
    player: AutoPlayer;
    step: number;
    delay: number;
    hover: number;
    wait: number;
    prng?: PRNG;

    constructor(
        gameDisplay: GameDisplay,
        step?: number,
        delay?: number,
        hover?: number,
        wait?: number,
        prng?: PRNG,
    ) {
        this.gameDisplay = gameDisplay;
        this.player = gameDisplay.getAutoPlayer();
        this.step = step || 20;
        this.delay = delay || 20;
        this.hover = hover || 500;
        this.wait = wait || 1000;
        this.prng = prng;
    }

    async playAllTiles(
        step?: number,
        delay?: number,
        hover?: number,
        wait?: number,
    ): Promise<void> {
        while (await this.playOneTile(step, delay, hover)) {
            await new Promise((resolve) =>
                setTimeout(resolve, wait || this.wait),
            );
        }
    }

    async playOneTile(
        step?: number,
        delay?: number,
        hover?: number,
    ): Promise<boolean> {
        step ||= this.step;
        delay ||= this.delay;
        hover ||= this.hover;

        const option = this.player.suggestOneTile(this.prng);
        if (!option) return false;

        const el =
            this.gameDisplay.tileStackDisplay.tileDisplays[option.indexOnStack]
                .draggable.element;

        const placeholderDisplay =
            this.gameDisplay.gridDisplay.tileDisplays.get(option.placeholder);
        if (!placeholderDisplay) return false;

        const fromRect = el.getBoundingClientRect();
        const fromCoord = {
            x: fromRect.x + 0.5 * fromRect.width,
            y: fromRect.y + 0.5 * fromRect.height,
        };

        const getToCoord = () => {
            const toRect = placeholderDisplay.element.getBoundingClientRect();
            return {
                x: toRect.x + 0.5 * toRect.width,
                y: toRect.y + 0.5 * toRect.height,
            };
        };

        el.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: fromCoord.x,
                clientY: fromCoord.y,
                pointerId: 1,
            }),
        );

        const progressPerStep = step / dist(fromCoord, getToCoord());

        let progress = 0;
        while (progress <= 1 + (hover / delay) * progressPerStep) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            const toCoord = getToCoord();
            const d = dist(fromCoord, toCoord);
            el.dispatchEvent(
                new PointerEvent("pointermove", {
                    clientX:
                        Math.max(0, 1 - progress) * fromCoord.x +
                        Math.min(1, progress) * toCoord.x +
                        5 * Math.random(),
                    clientY:
                        Math.max(0, 1 - progress) * fromCoord.y +
                        Math.min(1, progress) * toCoord.y +
                        5 * Math.random(),
                    pointerId: 1,
                }),
            );
            progress += progressPerStep;
        }

        const toCoord = getToCoord();
        el.dispatchEvent(
            new PointerEvent("pointerup", {
                clientX:
                    Math.max(0, 1 - progress) * fromCoord.x +
                    Math.min(1, progress) * toCoord.x,
                clientY:
                    Math.max(0, 1 - progress) * fromCoord.y +
                    Math.min(1, progress) * toCoord.y,
                pointerId: 1,
            }),
        );

        return true;
    }
}
