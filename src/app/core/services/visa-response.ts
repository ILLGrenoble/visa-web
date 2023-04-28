

export interface ResponseMetadata {
    [key: string]: number;
}

export interface Response<T> {
    data: T;
    errors?: string[];
    _metadata?: ResponseMetadata;
}


