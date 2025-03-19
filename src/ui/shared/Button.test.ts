import { describe, jest, test, expect, beforeAll } from "@jest/globals";
import { Button } from "./Button";

describe("Button", () => {
    test("can be created", () => {
        const tapHandler = jest.fn((evt: PointerEvent) => {});
        const button = new Button("a", "b", tapHandler);
        button.element.dispatchEvent(new MouseEvent("pointerdown"));
        expect(tapHandler).not.toBeCalled();
        button.element.dispatchEvent(new MouseEvent("pointerup"));
        expect(tapHandler).toBeCalled();
        button.destroy();
    });
});
