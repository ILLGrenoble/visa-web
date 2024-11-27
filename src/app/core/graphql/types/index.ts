export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: any }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
};

export type OpenStackProviderConfiguration = {
    __typename?: 'OpenStackProviderConfiguration';
    applicationId: Scalars['String'];
    applicationSecret: Scalars['String'];
    computeEndpoint: Scalars['String'];
    imageEndpoint: Scalars['String'];
    networkEndpoint: Scalars['String'];
    identityEndpoint: Scalars['String'];
    addressProvider: Scalars['String'];
    addressProviderUUID: Scalars['String'];
};

export type WebProviderConfiguration = {
    __typename?: 'WebProviderConfiguration';
    url: Scalars['String'];
    authToken: Scalars['String'];
};

export type CloudClient = {
    __typename?: 'CloudClient';
    id: Scalars['Int'];
    name: Scalars['String'];
    type: Scalars['String'];
    serverNamePrefix: Scalars['String'];
    visible: Scalars['Boolean'];
    openStackProviderConfiguration?: Maybe<OpenStackProviderConfiguration>;
    webProviderConfiguration?: Maybe<WebProviderConfiguration>;
};

export type CloudFlavour = {
    __typename?: 'CloudFlavour';
    id: Scalars['String'];
    name: Scalars['String'];
    cpus: Scalars['Int'];
    disk: Scalars['Int'];
    ram: Scalars['Int'];
};

export type CloudImage = {
    __typename?: 'CloudImage';
    id: Scalars['String'];
    name: Scalars['String'];
    size: Scalars['Int'];
    createdAt: Scalars['String'];
};

export type CloudInstance = {
    __typename?: 'CloudInstance';
    id?: Maybe<Scalars['String']>;
    name?: Maybe<Scalars['String']>;
    address?: Maybe<Scalars['String']>;
    fault?: Maybe<CloudInstanceFault>;
    securityGroups?: Maybe<Array<Scalars['String']>>;
};

export type CloudInstanceFault = {
    __typename?: 'CloudInstanceFault';
    message?: Maybe<Scalars['String']>;
    code?: Maybe<Scalars['Int']>;
    details?: Maybe<Scalars['String']>;
    created?: Maybe<Scalars['String']>;
};

export type CloudLimit = {
    __typename?: 'CloudLimit';
    maxTotalRAMSize: Scalars['Int'];
    totalRAMUsed: Scalars['Int'];
    maxTotalInstances: Scalars['Int'];
    totalInstancesUsed: Scalars['Int'];
    maxTotalCores: Scalars['Int'];
    totalCoresUsed: Scalars['Int'];
};

export type DetailedCloudLimit = {
    __typename?: 'DetailedCloudLimit';
    cloudClient: CloudClient;
    cloudLimit?: Maybe<CloudLimit>;
    error?: Scalars['String'];
};

export type RoleInput = {
    name: Scalars['String'];
    description?: Maybe<Scalars['String']>;
};

export type Experiment = {
    __typename?: 'Experiment';
    /** Experiment identifier */
    id: Scalars['String'];
    instrument: Instrument;
    proposal: Proposal;
};

export type ExperimentConnection = {
    __typename?: 'ExperimentConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<Experiment>>>;
};

export type Flavour = {
    __typename?: 'Flavour';
    id: Scalars['Int'];
    name: Scalars['String'];
    memory: Scalars['Int'];
    cpu: Scalars['Int'];
    computeId: Scalars['String'];
    cloudFlavour?: Maybe<CloudFlavour>;
    cloudClient?: Maybe<CloudClient>;
};

export type FlavourConnection = {
    __typename?: 'FlavourConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<Flavour>>>;
};

export type FlavourLimit = {
    __typename?: 'FlavourLimit';
    id: Scalars['Int'];
    objectId: Scalars['Int'];
    objectType: Scalars['String'];
    objectName: Scalars['String'];
    flavour: Flavour;
};

export type Image = {
    __typename?: 'Image';
    id: Scalars['Int'];
    name: Scalars['String'];
    version: Scalars['String'];
    description?: Maybe<Scalars['String']>;
    icon?: Maybe<Scalars['String']>;
    computeId: Scalars['String'];
    cloudImage?: Maybe<CloudImage>;
    visible: Scalars['Boolean'];
    autologin: Maybe<Scalars['String']>;
    protocols?: Maybe<Array<Maybe<ImageProtocol>>>;
    bootCommand: Scalars['String'];
    cloudClient?: Maybe<CloudClient>;
};

export type ImageConnection = {
    __typename?: 'ImageConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<Image>>>;
};

export type ImageProtocol = {
    __typename?: 'ImageProtocol';
    id: Scalars['Int'];
    name: Scalars['String'];
    port: Scalars['Int'];
};

export type Instance = {
    __typename?: 'Instance';
    id: Scalars['Int'];
    uid: Scalars['String'];
    name: Scalars['String'];
    ipAddress: Scalars['String'];
    comments?: Maybe<Scalars['String']>;
    state: InstanceState;
    members?: Maybe<Array<Maybe<InstanceMember>>>;
    plan?: Maybe<Plan>;
    cloudInstance?: Maybe<CloudInstance>;
    experiments?: Maybe<Array<Maybe<Experiment>>>;
    protocols?: Maybe<Array<Maybe<ProtocolStatus>>>;
    createdAt: Scalars['String'];
    lastSeenAt?: Maybe<Scalars['String']>;
    lastInteractionAt?: Maybe<Scalars['String']>;
    terminationDate?: Maybe<Scalars['String']>;
    sessions?: Maybe<Array<Maybe<InstanceSessionMember>>>;
    activeSessions?: Maybe<Array<Maybe<InstanceSessionMember>>>;
    owner?: Maybe<User>;
    username: Scalars['String'];
    attributes: Maybe<Array<Maybe<InstanceAttribute>>>;
    cloudClient?: Maybe<CloudClient>;
};

export type InstanceConnection = {
    __typename?: 'InstanceConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<Instance>>>;
};

export type InstanceMember = {
    __typename?: 'InstanceMember';
    id: Scalars['Int'];
    user: User;
    role: Scalars['String'];
    createdAt: Scalars['String'];
};

export type InstanceAttribute = {
    __typename?: 'InstanceAttribute';
    id: Scalars['Int'];
    name: Scalars['String'];
    value: Scalars['String'];
};

export type InstanceSession = {
    __typename?: 'InstanceSession';
    id: Scalars['Int'];
    connectionId: Scalars['String'];
    instance: Instance;
    current: Scalars['Boolean'];
};

export type InstanceSessionMember = {
    __typename?: 'InstanceSessionMember';
    id: Scalars['Int'];
    instanceSession: InstanceSession;
    sessionId: Scalars['String'];
    user: User;
    createdAt: Scalars['String'];
    updatedAt: Scalars['String'];
    lastInteractionAt: Scalars['String'];
    role?: Maybe<Scalars['String']>;
    active?: Maybe<Scalars['Boolean']>;
    duration: Scalars['Int'];
};

export type InstanceJupyterSession = {
    __typename?: 'InstanceJupyterSession';
    id: Scalars['Int'];
    kernelId: Scalars['String'];
    sessionId: Scalars['String'];
    user: User;
    instance: Instance;
    createdAt: Scalars['String'];
    updatedAt: Scalars['String'];
    active?: Maybe<Scalars['Boolean']>;
    duration: Scalars['Int'];
};

export type InstanceSessionMemberConnection = {
    __typename?: 'InstanceSessionMemberConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<InstanceSessionMember>>>;
};

export enum InstanceState {
    Unknown = 'UNKNOWN',
    Building = 'BUILDING',
    Starting = 'STARTING',
    Active = 'ACTIVE',
    Stopping = 'STOPPING',
    Stopped = 'STOPPED',
    Rebooting = 'REBOOTING',
    Unavailable = 'UNAVAILABLE',
    Error = 'ERROR',
    Deleting = 'DELETING',
    Deleted = 'DELETED'
}

export type InstanceStateCount = {
    __typename?: 'InstanceStateCount';
    state: InstanceState;
    count: Scalars['Int'];
};

export type Instrument = {
    __typename?: 'Instrument';
    id: Scalars['Int'];
    name: Scalars['String'];
};

export type Memory = {
    __typename?: 'Memory';
    total: Scalars['Int'];
    max: Scalars['Int'];
    free: Scalars['Int'];
    used: Scalars['Int'];
};

export type Message = {
    __typename?: 'Message';
    message: Scalars['String'];
};

export type Mutation = {
    __typename?: 'Mutation';
    /** Create an image */
    createImage: Image;
    /** Update an image */
    updateImage: Image;
    /** Delete an image */
    deleteImage: Image;
    /** Create a flavour */
    createFlavour: Flavour;
    /** Update an flavour */
    updateFlavour: Flavour;
    /** Delete a flavour */
    deleteFlavour: Flavour;
    /** Create a plan */
    createPlan: Plan;
    /** Update a plan */
    updatePlan: Plan;
    /** Delete a plan */
    deletePlan: Plan;
    /** Reboot an instance */
    rebootInstance: Message;
    /** Start an instance */
    startInstance: Message;
    /** Shutdown an instance */
    shutdownInstance: Message;
    /** Delete an instance */
    deleteInstance: Message;
    /** Update an instance termination date */
    updateInstanceTerminationDate: Message;
};


export type OrderBy = {
    name: Scalars['String'];
    ascending?: Maybe<Scalars['Boolean']>;
};

export type PageInfo = {
    __typename?: 'PageInfo';
    currentPage: Scalars['Int'];
    totalPages: Scalars['Int'];
    count: Scalars['Int'];
    offset: Scalars['Int'];
    limit: Scalars['Int'];
    hasNextPage: Scalars['Boolean'];
    hasPrevPage: Scalars['Boolean'];
};

export type Pagination = {
    offset: Scalars['Int'];
    limit?: Maybe<Scalars['Int']>;
};

export type Parameter = {
    name?: Maybe<Scalars['String']>;
    value?: Maybe<Scalars['String']>;
};

export type Plan = {
    __typename?: 'Plan';
    id: Scalars['Int'];
    image?: Maybe<Image>;
    flavour?: Maybe<Flavour>;
    preset: Scalars['Boolean'];
};

export type PlanConnection = {
    __typename?: 'PlanConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<Plan>>>;
};

export type Proposal = {
    __typename?: 'Proposal';
    id: Scalars['Int'];
    identifier: Scalars['String'];
    title: Scalars['String'];
};

export type ProtocolStatus = {
    __typename?: 'ProtocolStatus';
    protocol: ImageProtocol;
    active: Scalars['Boolean'];
};

export type Query = {
    __typename?: 'Query';
    /** The authenticated user */
    viewer?: Maybe<User>;
    /** Get all plans */
    plans: PlanConnection;
    /** Get experiments */
    experiments: ExperimentConnection;
    /** Count experiments */
    countExperiments: Scalars['Int'];
    /** Get all flavours */
    flavours: FlavourConnection;
    /** Count all flavours */
    countFlavours: Scalars['Int'];
    /** Get all images */
    images: ImageConnection;
    /** Count all images */
    countImages: Scalars['Int'];
    /** Get all instruments */
    instruments?: Maybe<Array<Instrument>>;
    /** Get all image protcocols */
    imageProtocols?: Maybe<Array<Maybe<ImageProtocol>>>;
    /** Get all instances */
    instances: InstanceConnection;
    /** Count all instances */
    countInstances: Scalars['Int'];
    instance: Instance;
    /** Get recently created instances */
    recentInstances: InstanceConnection;
    /** Count all instances for a given state */
    countInstancesForState: Scalars['Int'];
    /** Count all instances for a given set of states */
    countInstancesForStates?: Maybe<Array<Maybe<InstanceStateCount>>>;
    /**
     * Get all instance sessions
     *    activeInstanceSessions
     * Get all users
     */
    users: UserConnection;
    /** Count all users */
    countUsers: Scalars['Int'];
    /** Get user by their identifier */
    user: User;
    /** Get all roles */
    roles?: Maybe<Array<Maybe<Role>>>;
    /** Get memory information for the server instance */
    memory: Memory;
    /** Get images from cloud provider */
    cloudImages?: Maybe<Array<Maybe<CloudImage>>>;
    /** Get flavours from cloud prrovider */
    cloudFlavours?: Maybe<Array<Maybe<CloudFlavour>>>;
    /** Get cloud limits */
    cloudLimits?: Maybe<CloudLimit>;
    /** Get all sessions */
    sessions?: Maybe<InstanceSessionMemberConnection>;
};


export type QueryPlansArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};


export type QueryExperimentsArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};


export type QueryCountExperimentsArgs = {
    filter?: Maybe<QueryFilter>;
};


export type QueryFlavoursArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};


export type QueryCountFlavoursArgs = {
    filter?: Maybe<QueryFilter>;
};


export type QueryImagesArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};


export type QueryCountImagesArgs = {
    filter?: Maybe<QueryFilter>;
};


export type QueryInstancesArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};


export type QueryCountInstancesArgs = {
    filter?: Maybe<QueryFilter>;
};


export type QueryInstanceArgs = {
    id: Scalars['Int'];
};


export type QueryRecentInstancesArgs = {
    pagination: Pagination;
};


export type QueryCountInstancesForStateArgs = {
    state: InstanceState;
};


export type QueryCountInstancesForStatesArgs = {
    states?: Maybe<Array<Maybe<InstanceState>>>;
};


export type QueryUsersArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};


export type QueryCountUsersArgs = {
    filter?: Maybe<QueryFilter>;
};


export type QueryUserArgs = {
    id: Scalars['Int'];
};


export type QuerySessionsArgs = {
    filter?: Maybe<QueryFilter>;
    orderBy?: Maybe<OrderBy>;
    pagination: Pagination;
};

export type QueryFilter = {
    query: Scalars['String'];
    parameters?: Maybe<Array<Maybe<Parameter>>>;
};

export type InstanceFilterInput = {
    id: Maybe<Scalars['Int']>;
    nameLike: Maybe<Scalars['String']>;
    instrumentId: Maybe<Scalars['Int']>;
    imageId: Maybe<Scalars['Int']>;
    flavourId: Maybe<Scalars['Int']>;
    state: Maybe<Scalars['String']>;
    ownerId: Maybe<Scalars['String']>;
}

export type Role = {
    __typename?: 'Role';
    id: Scalars['Int'];
    name: Scalars['String'];
    description: Scalars['String'];
    expiresAt: Scalars['String'];
};

export type UserRole = {
    __typename?: 'UserRole';
    role: Role;
    expiresAt: Maybe<Scalars['String']>;
};

export type FlavourInput = {
    name: Scalars['String'];
    memory: Scalars['Int'];
    cpu: Scalars['Int'];
    cloudId?: Maybe<Scalars['Int']>;
    computeId: Scalars['String'];
    instrumentIds: Maybe<Array<Maybe<Scalars['Int']>>>
    roleIds: Maybe<Array<Maybe<Scalars['Int']>>>
};

export type ImageInput = {
    name: Scalars['String'];
    version?: Maybe<Scalars['String']>;
    description?: Maybe<Scalars['String']>;
    icon?: Maybe<Scalars['String']>;
    cloudId?: Maybe<Scalars['Int']>;
    computeId: Scalars['String'];
    visible: Scalars['Boolean'];
    protocolIds?: Maybe<Array<Scalars['Int']>>;
    bootCommand?: Maybe<Scalars['String']>;
    autologin?: Maybe<Scalars['String']>;
};

export type UserInput = {
    instanceQuota: Scalars['Int'],
    admin: Scalars['Boolean'];
    guest: Scalars['Boolean'];
    guestExpiresAt: Scalars['String'];
    groupIds: Maybe<Array<Maybe<Scalars['Int']>>>
};

export type PlanInput = {
    imageId: Scalars['Int'];
    flavourId: Scalars['Int'];
    preset: Scalars['Boolean'];
};

export type OpenStackProviderConfigurationInput = {
    applicationId: Scalars['String'];
    applicationSecret: Scalars['String'];
    computeEndpoint: Scalars['String'];
    imageEndpoint: Scalars['String'];
    networkEndpoint: Scalars['String'];
    identityEndpoint: Scalars['String'];
    addressProvider: Scalars['String'];
    addressProviderUUID: Scalars['String'];
};

export type WebProviderConfigurationInput = {
    url: Scalars['String'];
    authToken: Scalars['String'];
};

export type CloudClientInput = {
    name: Scalars['String'];
    type: Scalars['String'];
    serverNamePrefix: Scalars['String'];
    visible: Scalars['Boolean'];
    openStackProviderConfiguration?: Maybe<OpenStackProviderConfigurationInput>;
    webProviderConfiguration?: Maybe<WebProviderConfigurationInput>;
};

export type SystemNotificationInput = {
    level: Scalars['String'];
    message: Scalars['String'];
    activatedAt?: Maybe<Scalars['String']>;
};

export type SecurityGroupInput = {
    name: Scalars['String'];
    cloudId?: Maybe<Scalars['Int']>;
};

export type Employer = {
    __typename?: 'User';
    id: Scalars['Int'];
    name?: Maybe<Scalars['String']>;
    town?: Maybe<Scalars['String']>;
    countryCode?: Maybe<Scalars['String']>;
};

export type User = {
    __typename?: 'User';
    id: Scalars['Int'];
    firstName?: Maybe<Scalars['String']>;
    lastName?: Maybe<Scalars['String']>;
    email?: Maybe<Scalars['String']>;
    fullName?: Maybe<Scalars['String']>;
    affiliation?: Maybe<Employer>;
    instances?: Maybe<Array<Maybe<Instance>>>;
    experiments?: Maybe<Array<Maybe<Experiment>>>;
    activeUserRoles?: Maybe<Array<Maybe<UserRole>>>;
    groups?: Maybe<Array<Maybe<Role>>>;
    lastSeenAt?: Maybe<Scalars['String']>;
    activatedAt?: Maybe<Scalars['String']>;
};

export type UserConnection = {
    __typename?: 'UserConnection';
    pageInfo?: Maybe<PageInfo>;
    data?: Maybe<Array<Maybe<User>>>;
};

export type NumberInstancesByFlavour = {
    __typename?: 'NumberInstancesByFlavour';
    id: Scalars['Int'];
    name: Scalars['String'];
    total: Scalars['Int'];
};

export type NumberInstancesByImage = {
    __typename?: 'NumberInstancesByImage';
    id: Scalars['Int'];
    version: Scalars['String'];
    name: Scalars['String'];
    total: Scalars['Int'];
};

export type NumberInstancesByCloudClient = {
    __typename?: 'NumberInstancesByCloudClient';
    id: Scalars['Int'];
    name: Scalars['String'];
    total: Scalars['Int'];
};

export type SystemNotification = {
    __typename?: 'SystemNotification';
    id: Scalars['Int'];
    level: Scalars['String'];
    message: Scalars['String'];
    activatedAt?: Maybe<Scalars['String']>;
};

export type SecurityGroup = {
    __typename?: 'SecurityGroup';
    id: Scalars['Int'];
    name: Scalars['String'];
    cloudClient?: Maybe<CloudClient>;
};

export type SecurityGroupFilter = {
    __typename?: 'SecurityGroupFilter';
    id: Scalars['Int'];
    securityGroup: SecurityGroup;
    objectId: Scalars['Int'];
    objectType: Scalars['String'];
    objectName: Maybe<Scalars['String']>;
};

export type SecurityGroupFilterInput = {
    securityGroupId: Scalars['Int'];
    objectId: Scalars['Int'];
    objectType: Scalars['String'];
};

export type CloudSecurityGroup = {
    name: Scalars['String'];
    integration: Maybe<SecurityGroup>;
};

export type ApplicationCredentialDetail = {
    __typename?: 'ApplicationCredentialDetail';
    id: Scalars['Int'];
    name: Scalars['String'];
    applicationId: Scalars['String'];
    lastUsedAt: Scalars['String'];
};

export type ApplicationCredential = {
    __typename?: 'ApplicationCredential';
    id: Scalars['Int'];
    name: Scalars['String'];
    applicationId: Scalars['String'];
    applicationSecret: Scalars['String'];
};

export type ApplicationCredentialInput = {
    name: Scalars['String'];
};

export type InstanceExtensionRequest = {
    __typename?: 'InstanceExtensionRequest';
    id: Scalars['Int'];
    comments: Scalars['String'];
    createdAt: Scalars['String'];
    instance: Instance;
};

export type InstanceExtensionResponseInput = {
    handlerId: Scalars['String'];
    handlerComments: Scalars['String'];
    accepted: Scalars['Boolean'];
    terminationDate: Scalars['String'];
};
