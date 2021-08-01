export interface UsersFilterState {
    filters: {
        userId: number;
    };
    page: number;
    descending: boolean;
    orderBy: string;
}
