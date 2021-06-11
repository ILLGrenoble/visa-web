import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {CloudFlavour, Flavour, FlavourConnection, Pagination} from '../../core/graphql/types';

interface AllQueryResponse {
    flavours: FlavourConnection;
    cloudFlavours: CloudFlavour[];
}

interface FlavourQueryResponse {
    flavours: FlavourConnection;
}

interface CreateResponse {
    createFlavour: Flavour;
}

interface UpdateResponse {
    updateFlavour: Flavour;
}

interface DeleteResponse {
    deleteFlavour: Flavour;
}

const GetAll = gql`
    query AllFlavours($pagination: Pagination!){
        flavours(pagination:$pagination) {
            pageInfo {
                currentPage
                totalPages
                count
                offset
                limit
                hasNextPage
                hasPrevPage
            }
            data {
                id
                name
                memory
                cpu
                computeId
            }
        }
        cloudFlavours{
          id
          name
          cpus
          disk
          ram
      }
    }
`;

const GetFlavours = gql`
    query AllFlavours($pagination: Pagination!){
        flavours(pagination:$pagination) {
            pageInfo {
                currentPage
                totalPages
                count
                offset
                limit
                hasNextPage
                hasPrevPage
            }
            data {
                id
                name
                memory
                cpu
                computeId
            }
        }
    }
`;

const UpdateFlavour = gql`
    mutation UpdateFlavour($id: Int!,$input: UpdateFlavourInput!){
        updateFlavour(id:$id,input:$input) {
            id
            name
            memory
            cpu
            computeId
        }
    }
`;

const CreateFlavour = gql`
    mutation CreateFlavour($input: CreateFlavourInput!){
        createFlavour(input:$input) {
            id
            name
            memory
            cpu
            computeId
        }
    }
`;

const DeleteFlavour = gql`
    mutation DeleteFlavour($id: Int!){
        deleteFlavour(id:$id) {
            id
        }
    }
`;

const GetCloudFlavours = gql`
    {
    cloudFlavours{
          id
          name
          cpus
          disk
          ram
      }
    }
`;

@Injectable()
export class FlavourService {

    constructor(private apollo: Apollo) {
    }

    public getFlavours(pagination: Pagination): Promise<FlavourConnection> {
        return this.apollo.watchQuery<FlavourQueryResponse>({
            query: GetFlavours,
            variables: {pagination},
        }).result()
            .then(({data}) => {
                return data.flavours;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public deleteFlavour(id): Promise<Flavour> {
        return this.apollo.mutate<DeleteResponse>({
            mutation: DeleteFlavour,
            variables: {id},
        }).toPromise()
            .then(({data}) => {
                return data.deleteFlavour;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public createFlavour(flavourInput): Promise<Flavour> {
        return this.apollo.mutate<CreateResponse>({
            mutation: CreateFlavour,
            variables: {input: flavourInput},
        }).toPromise()
            .then(({data}) => {
                return data.createFlavour;
            })
            .catch((error) => {
                throw new Error(error);
            });
    }

    public updateFlavour(id: number, input: Flavour): Promise<Flavour> {
        return this.apollo.mutate<UpdateResponse>({
            mutation: UpdateFlavour,
            variables: {id, input},
        }).toPromise()
            .then(({data}) => {
                return data.updateFlavour;
            })
            .catch((error) => {
                throw new Error(error);
            });

    }

    public getAll(pagination: Pagination): Promise<{ flavourConnection: FlavourConnection, cloudFlavours: CloudFlavour[] }> {
        return this.apollo.watchQuery<AllQueryResponse>({
            query: GetAll,
            variables: {pagination},
        }).result()
            .then(({data}) => {
                const flavourConnection = data.flavours;
                const cloudFlavours = data.cloudFlavours;
                return {flavourConnection, cloudFlavours};
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public getCloudFlavours(): Promise<CloudFlavour[]> {
        return this.apollo.watchQuery<any>({
            query: GetCloudFlavours,
        }).result()
            .then(({data}) => {
                return data.cloudFlavours;
            }).catch((error) => {
                throw new Error(error);
            });
    }

}
