const iso8601 = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/;

const isIso8601 = (value: string): boolean => {
    if (value === null || value === undefined) {
        return false;
    }

    return iso8601.test(value);
}
export const convertJsonDates = (body: any) => {
    if (body === null || body === undefined) {
        return;
    }

    if (typeof body !== 'object') {
        return;
    }

    for (const key of Object.keys(body)) {
        const value = body[key];
        if (isIso8601(value)) {
            body[key] = new Date(value);

        } else if (typeof value === 'object') {
            convertJsonDates(value);
        }
    }
}
