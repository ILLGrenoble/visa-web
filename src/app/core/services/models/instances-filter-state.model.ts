export interface InstancesFilterState {
    filters: {
        name: string;
        id: number;
        instrument: number;
        owner: number;
    };
    page: number;
    limit: number;
    descending: boolean;
    orderBy: string;
}

export function toParams(filterState: InstancesFilterState): any {
    const params: any = {};
    if (filterState.filters) {
        if (filterState.filters.name) {
            params.nameLike = filterState.filters.name;
        }
        if (filterState.filters.id) {
            params.id = filterState.filters.id;
        }
        if (filterState.filters.owner) {
            params.ownerId = filterState.filters.owner;
        }
        if (filterState.filters.instrument) {
            params.instrumentId = filterState.filters.instrument;
        }
        if (filterState.page) {
            params.page = filterState.page;
        }
        if (filterState.limit) {
            params.limit = filterState.limit;
        }
        if (filterState.orderBy) {
            params.orderBy = filterState.orderBy;
        }
        if (filterState.descending) {
            params.descending = filterState.descending;
        }
    }
    return params;
}
