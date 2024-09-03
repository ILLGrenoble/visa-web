
export interface InstanceStateChangedEvent {
    instanceId: number;
    instanceUid: string;
    name: string;
    comments: string;
    state: string;
    ipAddress: string;
    terminationDate: Date;
    expirationDate: Date;
    deleteRequested: boolean;
    unrestrictedMemberAccess: boolean;
    activeProtocols: string[];
}
