/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import icons from "../shared/icons";
import { NavigateEvent } from "../shared/UserEvent";
import { Pages } from "../shared/UserEvent";
import { UserEventType } from "../shared/UserEvent";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { msg, t } from "@lingui/core/macro";
import { i18n, MessageDescriptor } from "@lingui/core";
import { StatisticsMonitor } from "../../stats/StatisticsMonitor";
import { SetupCatalog } from "../../saveGames";
import { SmallNavBar, SmallNavBarItems } from "../settings/SmallNavBar";

export type StatisticsSection = {
    heading?: {
        title: MessageDescriptor;
        key?: string;
    };
    multiColumn?: number;
    columns: (MessageDescriptor | null)[];
    rows: {
        title: MessageDescriptor;
        keys: string[];
    }[];
    footer?: {
        title: MessageDescriptor;
        keys: string[];
    }[];
};

export class StatisticsDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    navBar: SmallNavBar;

    constructor(stats: StatisticsMonitor) {
        super();

        // main element
        const element = (this.element = createElement(
            "div",
            "screen with-navbar statistics-display",
        ));

        // navbar
        const navBar = (this.navBar = new SmallNavBar((page: Pages) => {
            this.dispatchEvent(new NavigateEvent(page));
        }));
        navBar.activeTab = SmallNavBarItems.Statistics;
        element.appendChild(navBar.element);

        // main page text
        const article = createElement("article", null, element);
        const h3 = createElement("h3", null, article);
        h3.innerHTML = t({ id: "ui.statistics.title", message: "Statistics" });

        for (const section of StatisticsSections) {
            article.appendChild(this.buildSection(stats, section));
        }

        if (article.childNodes.length == 1) {
            const p = createElement("p", null, article);
            p.innerHTML = t({
                id: "ui.statistics.notPlayed",
                message: "You haven’t played yet!",
            });
        }

        /*
        // table with statistics
        const table = createElement("table", "statistics", article);
        const tbody = createElement("tbody", null, table);

        console.log(stats);
        const rows = [...stats.counters.entries()];
        rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        rows.sort((a, b) => b[1] - a[1]);
        for (const [key, value] of rows) {
            const tr = createElement("tr", null, tbody);
            const th = createElement("th", null, tr);
            th.innerHTML = key;
            const td = createElement("td", null, tr);
            td.innerHTML = `${value}`;
        }
        */
    }

    destroy() {
        this.navBar.destroy();
        this.element.remove();
    }

    rescale() {}

    private buildSection(stats: StatisticsMonitor, section: StatisticsSection) {
        const fragment = new DocumentFragment();

        // only list rows with non-zero values
        const nonZeroRows = section.rows.filter((row) => {
            for (const column of row.keys) {
                if (stats.counters.get(column) || 0 > 0) {
                    return true;
                }
            }
            return false;
        });
        if (nonZeroRows.length == 0) {
            return fragment;
        }

        // wrap table in two columns?
        const multiColumn = Math.min(
            nonZeroRows.length,
            Math.max(1, section.multiColumn || 1),
        );

        // split rows
        const rowsPerColumn = Math.ceil(nonZeroRows.length / multiColumn);
        const rowsInColumns: (typeof section.rows)[] = [];
        for (let i = 0; i < multiColumn; i++) {
            rowsInColumns.push(
                nonZeroRows.slice(i * rowsPerColumn, (i + 1) * rowsPerColumn),
            );
        }

        // insert heading
        if (section.heading) {
            const h3 = createElement("h4", null, fragment);
            if (section.heading.key) {
                h3.innerHTML = i18n.t(section.heading.title.id, {
                    value: stats.counters.get(section.heading.key) || 0,
                });
            } else {
                h3.innerHTML = t(section.heading.title as MessageDescriptor);
            }
        }

        // table with statistics
        const table = createElement("table", "statistics", fragment);

        // head
        const thead = createElement("thead", null, table);
        const tr = createElement("tr", null, thead);
        for (let i = 0; i < multiColumn; i++) {
            for (let c = 0; c < section.columns.length; c++) {
                const column = section.columns[c];
                if (column) {
                    const th = createElement("th", c == 0 ? "label" : "", tr);
                    th.innerHTML = t(column);
                } else {
                    createElement("td", null, tr);
                }
            }
        }

        // rows
        const tbody = createElement("tbody", null, table);
        for (let i = 0; i < rowsPerColumn; i++) {
            const tr = createElement("tr");
            for (const column of rowsInColumns) {
                const row = column[i];
                if (row) {
                    const th = createElement("th", "label", tr);
                    th.innerHTML = t(row.title);
                    for (const key of row.keys) {
                        const td = createElement("td", null, tr);
                        const n = stats.counters.get(key) || 0;
                        td.innerHTML = `${n}`;
                    }
                } else {
                    const th = createElement("th", "label", tr);
                    for (const key of nonZeroRows[0].keys) {
                        const td = createElement("td", null, tr);
                    }
                }
            }
            tbody.appendChild(tr);
        }

        // footer rows
        if (section.footer) {
            const tfoot = createElement("tfoot", null, table);
            const tr = createElement("tr");
            for (const row of section.footer) {
                const th = createElement("th", null, tr);
                th.innerHTML = t(row.title);
                for (const key of row.keys) {
                    const td = createElement("td", null, tr);
                    const n = stats.counters.get(key) || 0;
                    td.innerHTML = `${n}`;
                }
                for (let i = 1; i < multiColumn; i++) {
                    const td = createElement("td", null, tr);
                    td.colSpan = 1 + row.keys.length;
                }
            }
            tfoot.appendChild(tr);
        }

        return fragment;
    }
}

const StatisticsSections: StatisticsSection[] = [
    {
        heading: {
            title: msg({
                id: "ui.statistics.headings.ShapeCompleted",
                message:
                    "{value, plural, one {You have formed one shape.} other {You have formed # shapes.}}",
            }),
            key: "ShapeCompleted",
        },
        columns: [
            null,
            msg({
                id: "ui.statistics.columns.HighScore",
                message: "High score",
            }),
            msg({
                id: "ui.statistics.columns.ShapeCompleted",
                message: "Shapes formed",
            }),
            msg({
                id: "ui.statistics.columns.GameCompleted",
                message: "Games completed",
            }),
        ],
        rows: [...SetupCatalog.atlas.values()].map((atlasDef) => {
            return {
                title: atlasDef.atlas.tilingName as MessageDescriptor,
                keys: [
                    `HighScore.{"atlas":"${atlasDef.atlas.id}","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}`,
                    `ShapeCompleted.{"atlas":"${atlasDef.atlas.id}","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}`,
                    `GameCompleted.${atlasDef.atlas.id}`,
                ],
            };
        }),
    },
    {
        multiColumn: 2,
        heading: {
            title: msg({
                id: "ui.statistics.headings.TilePlaced",
                message:
                    "{value, plural, one {You have placed one tile.} other {You have placed # tiles.}}",
            }),
            key: "TilePlaced",
        },
        columns: [
            null,
            msg({
                id: "ui.statistics.columns.TilePlaced",
                message: "Tiles placed",
            }),
        ],
        rows: [
            {
                title: msg({
                    id: "ui.statistics.counter.TilePlaced.square",
                    message: "Squares",
                }),
                keys: [`TilePlaced.square`],
            },
            {
                title: msg({
                    id: "ui.statistics.counter.TilePlaced.triangle",
                    message: "Triangles",
                }),
                keys: [`TilePlaced.triangle`],
            },
            {
                title: msg({
                    id: "ui.statistics.counter.TilePlaced.rhombus",
                    message: "Rhombi",
                }),
                keys: [`TilePlaced.rhombus`],
            },
            {
                title: msg({
                    id: "ui.statistics.counter.TilePlaced.pentagon",
                    message: "Pentagons",
                }),
                keys: [`TilePlaced.pentagon`],
            },
            {
                title: msg({
                    id: "ui.statistics.counter.TilePlaced.hexagon",
                    message: "Hexagons",
                }),
                keys: [`TilePlaced.hexagon`],
            },
            {
                title: msg({
                    id: "ui.statistics.counter.TilePlaced.kite",
                    message: "Kites",
                }),
                keys: [`TilePlaced.kite`],
            },
        ],
    },
];
