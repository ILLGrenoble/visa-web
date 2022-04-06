export interface UsersFilterState {
    filters: {
        userId: string;
        activated: boolean;
        role: string;
    };
    page: number;
    descending: boolean;
    orderBy: string;
}
