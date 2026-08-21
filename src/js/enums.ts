export const EMAIL_NOTIFICATION_OPTIONS_PBS = {
    never: "n",
    abort: "a",
    begin: "b",
    end: "e",
};

export const EMAIL_NOTIFICATIONS = {
    ...EMAIL_NOTIFICATION_OPTIONS_PBS,
    // abort, begin, and end
    abe:
        EMAIL_NOTIFICATION_OPTIONS_PBS.abort +
        EMAIL_NOTIFICATION_OPTIONS_PBS.begin +
        EMAIL_NOTIFICATION_OPTIONS_PBS.end,
};
