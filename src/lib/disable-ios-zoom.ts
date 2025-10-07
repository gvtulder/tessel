/**
 * SPDX-License-Identifier: CC-BY-NC-SA-3.0
 * https://discourse.threejs.org/t/iphone-how-to-remove-text-selection-magnifier/47812/11
 */

export default () => {
    function createHandler(func: (e: Event) => void, timeout: number | null) {
        const timer = null;
        let pressed = false;

        return function (this: unknown, e: Event) {
            if (timer) {
                clearTimeout(timer);
            }

            if (pressed) {
                if (func) {
                    func.apply(this, [e]);
                }
                clear();
            } else {
                pressed = true;
                setTimeout(clear, timeout || 500);
            }
        };

        function clear() {
            timeout = null;
            pressed = false;
        }
    }

    const ignore = createHandler((e) => e.preventDefault(), 500);
    document.body.addEventListener("touchstart", ignore, { passive: false });
};
