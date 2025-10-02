import {DevicePool} from "@core";

export interface InstancesFilterState {
    filters: {
        name: string;
        id: number;
        flavour: number,
        image: number;
        instrument: number;
        state: string;
        user: string;
        devicePool: number;
    };
    page: number;
    descending: boolean;
    orderBy: string;
}
