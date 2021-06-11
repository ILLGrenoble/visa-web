import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Pagination, Plan, PlanConnection} from '../../core/graphql/types';

interface PlanQueryResponse {
    plans: PlanConnection;
}

interface CreateResponse {
    createPlan: Plan;
}

interface UpdateResponse {
    updatePlan: Plan;
}

interface DeleteResponse {
    deletePlan: Plan;
}

const GetPlans = gql`

    query allPlans($pagination: Pagination!){
        plans(pagination:$pagination){
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
                image {
                    id
                    name
                    description
                    version
                    icon
                    computeId
                    visible
                    deleted
                }
                flavour {
                    id
                    name
                    memory
                    cpu
                    computeId
                }
                preset
            }
        }
    }

`;

const UpdatePlan = gql`
    mutation UpdatePlan($id: Int!,$input: UpdatePlanInput!){
        updatePlan(id:$id,input:$input) {
            id
            image {
                id
                name
                description
                icon
                computeId
                visible
                deleted
            }
            flavour {
                id
                name
                memory
                cpu
                computeId
            }
        }
    }
`;

const CreatePlan = gql`
    mutation CreatePlan($input: CreatePlanInput!){
        createPlan(input:$input) {
            id
            image {
                id
                name
                description
                icon
                computeId
                visible
                deleted
            }
            flavour {
                id
                name
                memory
                cpu
                computeId
            }
        }
    }
`;

const DeletePlan = gql`
    mutation DeletePlan($id: Int!){
        deletePlan(id:$id) {
            id
            image {
                id
                name
                description
                icon
                computeId
                visible
                deleted
            }
            flavour {
                id
                name
                memory
                cpu
                computeId
            }
        }
    }
`;

@Injectable()
export class PlanService {

    constructor(private apollo: Apollo) {
    }

    public getPlans(pagination: Pagination): Promise<PlanConnection> {
        return this.apollo.watchQuery<PlanQueryResponse>({
            query: GetPlans,
            variables : {pagination},
        }).result()
            .then(({data}) => {
                return data.plans;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public deletePlan(id): Promise<Plan> {
        return this.apollo.mutate<DeleteResponse>({
            mutation: DeletePlan,
            variables: {id},
        }).toPromise()
            .then(({data}) => {
                return data.deletePlan;
            })
            .catch((error) => {
                throw new Error(error);
            });
    }

    public createPlan(planInput: Plan): Promise<Plan> {
        return this.apollo.mutate<CreateResponse>({
            mutation: CreatePlan,
            variables: {input: planInput},
        }).toPromise()
            .then(({data}) => {
                return data.createPlan;
            })
            .catch((error) => {
                throw new Error(error);
            });
    }

    public updatePlan(id: number, input: Plan): Promise<any> {
        return this.apollo.mutate<UpdateResponse>({
            mutation: UpdatePlan,
            variables: {id, input},
        }).toPromise()
            .then(({data}) => {
                return data.updatePlan;
            })
            .catch((error) => {
                throw new Error(error);
            });
    }

}
