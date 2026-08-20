type NotificationLabel = "never" | "abort" | "begin" | "end";

export const EMAIL_NOTIFICATION_OPTIONS_PBS: Array<{ label: NotificationLabel; value: string }> = [
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

function getNotificationValue(label: NotificationLabel): string {
    const option = EMAIL_NOTIFICATION_OPTIONS_PBS.find((o) => o.label === label);
    if (!option) {
        throw new Error(`Unknown notification label: ${label}`);
    }
    return option.value;
}

export const EMAIL_NOTIFICATIONS = {
    never: getNotificationValue("never"),
    abort: getNotificationValue("abort"),
    begin: getNotificationValue("begin"),
    end: getNotificationValue("end"),
    // abort, begin, and end
    abe: getNotificationValue("abort") + getNotificationValue("begin") + getNotificationValue("end"),
};
