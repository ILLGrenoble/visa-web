export interface InstancesFilterState {
    filters: {
        name: string;
        id: number;
        flavour: number,
        image: number;
        instrument: number;
        state: string;
        user: string;
    };
    columns: {
        image: boolean;
        flavour: boolean;
        cloudClient: boolean;
        terminationDate: boolean;
    };
    page: number;
    descending: boolean;
    orderBy: string;
}
