export const INITIAL_STATE = {
    sessionStats: {
        dataTransferred: 0,
        timeElapsed: 0,
        dataTransferredPerSecond: 0
    },
    sessionUsersConnected: [],
} as InstanceState;

export interface InstanceState {
    sessionStats: any;
    sessionUsersConnected: any;
}
