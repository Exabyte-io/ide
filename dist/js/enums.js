"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_NOTIFICATIONS = exports.EMAIL_NOTIFICATION_OPTIONS_PBS = void 0;
exports.EMAIL_NOTIFICATION_OPTIONS_PBS = [
    {
        label: "never",
        value: "n",
    },
    {
        label: "abort",
        value: "a",
    },
    {
        label: "begin",
        value: "b",
    },
    {
        label: "end",
        value: "e",
    },
];
// TODO: adjust to make modular to work not only with PBS, but SLURM etc.
class RMSNotificationsHandler {
    constructor(type) {
        this.type = type;
    }
    get options() {
        const config = {
            PBS: exports.EMAIL_NOTIFICATION_OPTIONS_PBS,
        };
        return config[this.type] || exports.EMAIL_NOTIFICATION_OPTIONS_PBS;
    }
    _getOptionValueByLabel(label) {
        return (this.options.find((o) => o.label === label) || {}).value;
    }
    get never() {
        return this._getOptionValueByLabel("never");
    }
    get abort() {
        return this._getOptionValueByLabel("abort");
    }
    get begin() {
        return this._getOptionValueByLabel("begin");
    }
    get end() {
        return this._getOptionValueByLabel("end");
    }
    get abe() {
        var _a, _b, _c;
        return ((_a = this.abort) !== null && _a !== void 0 ? _a : "") + ((_b = this.begin) !== null && _b !== void 0 ? _b : "") + ((_c = this.end) !== null && _c !== void 0 ? _c : "");
    }
}
const handler = new RMSNotificationsHandler("PBS");
exports.EMAIL_NOTIFICATIONS = {
    never: handler.never,
    abort: handler.abort,
    begin: handler.begin,
    end: handler.end,
    // abort, begin, and end
    abe: handler.abe,
};
