export function parseDurationString(value: string): number | null {
    if (!value || typeof value !== 'string') return null;

    const regex = /^\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*$/i;

    const match = value.trim().match(regex);
    if (!match) return null;

    const days = parseInt(match[1] || '0', 10);
    const hours = parseInt(match[2] || '0', 10);
    const minutes = parseInt(match[3] || '0', 10);

    const totalMinutes = days * 1440 + hours * 60 + minutes;
    return totalMinutes > 0 ? totalMinutes : null;
}

export function formatDuration(minutes: number): string {
    if (minutes == null || isNaN(minutes)) return '';
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    let result = '';
    if (days) result += `${days}d`;
    if (hours) result += `${hours}h`;
    if (mins || (!days && !hours)) result += `${mins}m`;
    return result;
}
