import { describe, jest, test, expect, beforeAll } from "@jest/globals";
import { MainMenuDisplay } from "./MainMenuDisplay";

describe("MainMenuDisplay", () => {
    test("can be created", () => {
        const display = new MainMenuDisplay();
        display.destroy();
    });
});
