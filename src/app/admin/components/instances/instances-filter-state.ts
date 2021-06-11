export interface InstancesFilterState {
    filters: {
        name: string;
        id: number;
        flavour: number,
        image: number;
        instrument: number;
        cycle: number;
        state: string;
        user: number;
    };
    columns: {
        image: boolean;
        flavour: boolean;
        terminationDate: boolean;
    };
    page: number;
    descending: boolean;
    orderBy: string;
}
