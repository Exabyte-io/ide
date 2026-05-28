export const EMAIL_NOTIFICATION_OPTIONS_PBS: Array<{ label: string; value: string }> = [
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
    type: string;

    constructor(type: string) {
        this.type = type;
    }

    get options(): Array<{ label: string; value: string }> {
        const config: Record<string, Array<{ label: string; value: string }>> = {
            PBS: EMAIL_NOTIFICATION_OPTIONS_PBS,
        };
        return config[this.type] || EMAIL_NOTIFICATION_OPTIONS_PBS;
    }

    _getOptionValueByLabel(label: string): string | undefined {
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
        return (this.abort ?? "") + (this.begin ?? "") + (this.end ?? "");
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
