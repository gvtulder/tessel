import { SettingRowOption } from "./SettingRowOption";

class StringOption extends SettingRowOption {
    constructor(key: string) {
        super(key);
        this.element.innerHTML = key;
    }
}
