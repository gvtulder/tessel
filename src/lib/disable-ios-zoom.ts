// https://discourse.threejs.org/t/iphone-how-to-remove-text-selection-magnifier/47812/11

export default () => {
    function createHandler(func, timeout) {
        const timer = null;
        let pressed = false;

        return function (...args) {
            if (timer) {
                clearTimeout(timer);
            }

            if (pressed) {
                if (func) {
                    func.apply(this, args);
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
