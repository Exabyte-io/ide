export const EMAIL_NOTIFICATION_OPTIONS_PBS = [
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
            PBS: EMAIL_NOTIFICATION_OPTIONS_PBS,
        };
        return config[this.type] || EMAIL_NOTIFICATION_OPTIONS_PBS;
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
        return this.abort + this.begin + this.end;
    }
}

const handler = new RMSNotificationsHandler("PBS");

export const EMAIL_NOTIFICATIONS = {
    never: handler.never,
    abort: handler.abort,
    begin: handler.begin,
    end: handler.end,
    // abort, begin, and end
    abe: handler.abe,
};
