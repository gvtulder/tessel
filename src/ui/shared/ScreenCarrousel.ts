/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { DragHandler, DragHandlerEvent } from "./DragHandler";
import { createElement } from "./html";
import { NavBar, NavBarItems } from "./NavBar";
import { ScreenDisplay } from "./ScreenDisplay";
import {
    cloneUserEvent,
    NavigateEvent,
    Pages,
    UserEvent,
    UserEventType,
} from "./UserEvent";
import { Button } from "./Button";
import { clip } from "../../geom/math";
import { DestroyableEventListenerSet } from "./DestroyableEventListenerSet";

const MARGIN = 10;

export type CarrouselDefinition = (CarrouselItem | CarrouselGroup)[];

type CarrouselItem = {
    tab: NavBarItems;
    icon: string;
    title: string | MessageDescriptor;
    page: Pages;
    screen: () => ScreenDisplay;
};

type CarrouselGroup = {
    tab: NavBarItems;
    icon: string;
    title: string | MessageDescriptor;
    items: CarrouselItem[];
};

type CarrouselItemOrGroup = {
    tab: NavBarItems;
    icon: string;
    title: string | MessageDescriptor;
    page?: Pages;
    screen?: () => ScreenDisplay;
    items?: CarrouselItem[];
};

export class ScreenCarrouselFactory {
    def: CarrouselDefinition;
    pages: ReadonlySet<string>;

    constructor(def: CarrouselDefinition) {
        this.def = def;

        const pages = new Set<Pages>();
        const process = (items: CarrouselItemOrGroup[]) => {
            for (const item of items) {
                if (item.items) {
                    process(item.items);
                }
                if (item.page) {
                    pages.add(item.page);
                }
            }
        };
        process(def);
        this.pages = pages;
    }

    build(): ScreenCarrousel {
        return new ScreenCarrousel(this.def);
    }

    has(page: string): boolean {
        return this.pages.has(page);
    }
}

const DRAG_MOVE_THRESHOLD = 50;
const MIN_SWIPE_VELOCITY = 5;
const SNAP_SPEED = 0.003;

export class ScreenCarrousel extends ScreenDisplay {
    navBars: NavBar[];
    lastPages: Map<NavBar, Pages>;

    element: HTMLElement;
    slidingElement: HTMLElement;

    listeners: DestroyableEventListenerSet;
    dragHandler: DragHandler;
    screens: {
        page: Pages;
        screen: ScreenDisplay;
        navBarTab: { navBar: NavBar; tab: NavBarItems }[];
    }[];

    _currentScreenIndex: number;
    currentOffset: number;

    snapAnimation?: number;

    forwardScreenEvent: (event: Event) => boolean;

    constructor(items: CarrouselDefinition) {
        super();
        this.element = createElement("div", "screen carrousel");
        this.slidingElement = createElement("div", "slider", this.element);
        this._currentScreenIndex = 0;
        this.currentOffset = 0;

        this.listeners = new DestroyableEventListenerSet();

        this.dragHandler = new DragHandler(this.element, false, "touch");
        this.dragHandler.onDragStart = (evt: DragHandlerEvent) => {
            this.cancelAnimation();
            this.element.classList.add("carrousel-moving");
        };
        this.dragHandler.onDragMove = (evt: DragHandlerEvent) => {
            if (Math.abs(evt.dxTotal) < DRAG_MOVE_THRESHOLD) return;
            this.cancelAnimation();
            this.updatePosition(evt.dx + this.currentOffset);
            this.element.classList.add("carrousel-moving");
        };
        this.dragHandler.onDragEnd = (evt: DragHandlerEvent) => {
            if (evt.velocityX < -MIN_SWIPE_VELOCITY && evt.dxTotal < 0) {
                const newScreenIndex = this.currentScreenIndex + 1;
                this.snapToPosition(-newScreenIndex * this.element.offsetWidth);
            } else if (evt.velocityX > MIN_SWIPE_VELOCITY && evt.dxTotal > 0) {
                const newScreenIndex = this.currentScreenIndex - 1;
                this.snapToPosition(-newScreenIndex * this.element.offsetWidth);
            } else {
                this.snapToPosition(evt.dx + this.currentOffset);
            }
        };

        this.forwardScreenEvent = (event: Event) => {
            return this.dispatchEvent(cloneUserEvent(event));
        };

        this.screens = [];
        this.navBars = [];
        this.lastPages = new Map<NavBar, Pages>();
        this.addCarrouselItems(items, []);

        this._currentScreenIndex = -1;
    }

    private addCarrouselItems(
        items: CarrouselItemOrGroup[],
        navBarTab: { navBar: NavBar; tab: NavBarItems }[],
    ): NavBar {
        // create navbar
        const main = this.navBars.length == 0;
        const navBar = new NavBar(main ? "main-navbar" : "small-navbar");
        this.navBars.push(navBar);

        if (main) {
            this.element.appendChild(navBar.element);
        } else {
            const sticky = createElement(
                "div",
                "settings-navbar-sticky",
                this.slidingElement,
            );
            sticky.style.left = `${100 * this.screens.length}vw`;
            sticky.style.width = `${100 * items.length}vw`;
            sticky.appendChild(navBar.element);
        }

        // add pages
        for (const item of items) {
            if (item.page && item.screen) {
                // first level
                const page = item.page;
                const screen = item.screen();

                // add screen to carrousel
                screen.element.style.left = `${100 * this.screens.length}vw`;
                this.slidingElement.appendChild(screen.element);
                this.screens.push({
                    page: item.page,
                    screen: screen,
                    navBarTab: [
                        ...navBarTab,
                        { navBar: navBar, tab: item.tab },
                    ],
                });
                for (const eventType of Object.values(UserEventType)) {
                    this.listeners.addEventListener(
                        screen,
                        eventType,
                        this.forwardScreenEvent,
                    );
                }

                // add button to navbar
                navBar.addButton(
                    item.tab,
                    new Button(
                        item.icon,
                        item.title,
                        () => this.dispatchEvent(new NavigateEvent(page)),
                        null,
                        !main,
                    ),
                );
            } else if (item.items) {
                // second level
                const subNavBar = this.addCarrouselItems(item.items, [
                    { navBar: navBar, tab: item.tab },
                ]);
                const firstPage = item.items[0].page;
                navBar.addButton(
                    item.tab,
                    new Button(item.icon, item.title, () => {
                        this.dispatchEvent(
                            new NavigateEvent(
                                this.lastPages.get(subNavBar) || firstPage,
                            ),
                        );
                    }),
                );
            }
        }
        return navBar;
    }

    get currentScreenIndex(): number {
        return this._currentScreenIndex;
    }

    get currentPage(): Pages {
        return this.screens[this.currentScreenIndex].page;
    }

    set currentScreenIndex(index: number) {
        this._currentScreenIndex = clip(index, 0, this.screens.length - 1);
        if (this.screens.length == 0) return;
        const item = this.screens[this._currentScreenIndex];
        for (const navBarTab of item.navBarTab) {
            navBarTab.navBar.activeKey = navBarTab.tab;
            this.lastPages.set(navBarTab.navBar, item.page);
        }
    }

    updatePosition(offsetX: number) {
        offsetX = clip(
            offsetX,
            -this.element.offsetWidth * (this.screens.length - 1),
            0,
        );
        this.currentOffset = offsetX;
        this.slidingElement.style.left = `${offsetX}px`;
    }

    snapToPosition(offsetX: number) {
        this.cancelAnimation();

        let newScreenIndex = Math.round(-offsetX / this.element.offsetWidth);
        newScreenIndex = clip(newScreenIndex, 0, this.screens.length - 1);
        if (newScreenIndex != this.currentScreenIndex) {
            this.currentScreenIndex = newScreenIndex;
            this.dispatchEvent(new NavigateEvent(this.currentPage));
        }

        const desiredOffset = Math.round(
            -newScreenIndex * this.element.offsetWidth,
        );
        let prevTime = 0;
        const animateSnap = (curTime: number) => {
            this.element.classList.add("carrousel-moving");
            const dtime = curTime - (prevTime || curTime);
            prevTime = curTime;
            const dist = Math.abs(desiredOffset - this.currentOffset);
            let step = this.element.offsetWidth * SNAP_SPEED * dtime;
            step = Math.min(step, (3 * dist) / (dtime || 1));
            step = Math.max(step, 1);
            let newOffset =
                desiredOffset < this.currentOffset
                    ? Math.max(desiredOffset, this.currentOffset - step)
                    : Math.min(desiredOffset, this.currentOffset + step);
            newOffset = Math.round(newOffset);
            if (Math.abs(newOffset - desiredOffset) > 0.5) {
                this.snapAnimation = window.requestAnimationFrame(animateSnap);
            } else {
                this.element.classList.remove("carrousel-moving");
            }
            this.updatePosition(newOffset);
        };
        this.snapAnimation = window.requestAnimationFrame(animateSnap);
    }

    showScreen(page: Pages): void {
        let index = 0;
        for (let i = 0; i < this.screens.length; i++) {
            if (this.screens[i].page === page) {
                index = i;
                break;
            }
        }
        if (index != this.currentScreenIndex) {
            this.cancelAnimation();
            const prevScreen = this.screens[this.currentScreenIndex];
            const newScreen = this.screens[index];
            this.currentScreenIndex = index;
            this.updatePosition(-index * this.element.offsetWidth);

            if (prevScreen) {
                prevScreen.screen.element.style.left =
                    newScreen.screen.element.style.left;
                window.setTimeout(() => {
                    this.resetScreenPositions();
                }, 1000);
                prevScreen.screen.element.classList.add("disappear");
                newScreen.screen.element.style.zIndex = "10";
                newScreen.screen.element.classList.add("appear");
            }
        }
    }

    resetScreenPositions() {
        for (let i = 0; i < this.screens.length; i++) {
            const el = this.screens[i].screen.element;
            el.style.left = `${100 * i}vw`;
            el.style.zIndex = "0";
            el.classList.remove("disappear", "appear");
        }
    }

    cancelAnimation() {
        if (this.snapAnimation) {
            window.cancelAnimationFrame(this.snapAnimation);
        }
        this.resetScreenPositions();
    }

    rescale(): void {
        this.updatePosition(
            -this.currentScreenIndex * this.element.offsetWidth,
        );
        for (const screen of this.screens) {
            if (screen.navBarTab.length > 1) {
                screen.screen.element.style.setProperty(
                    "--small-navbar-height",
                    `${this.navBars[this.navBars.length - 1].element.offsetHeight}px`,
                );
            }
            screen.screen.rescale();
        }
    }

    destroy(): void {
        this.cancelAnimation();
        this.listeners.removeAll();
        this.dragHandler.destroy();
        for (const navBar of this.navBars) {
            navBar.destroy();
        }
        for (const screen of this.screens) {
            screen.screen.element.remove();
            screen.screen.destroy();
        }
    }
}
