import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {InstanceSessionMemberConnection, OrderBy, Pagination, QueryFilter} from '../../core/graphql/types';

interface SessionsQueryResponse {
    sessions: InstanceSessionMemberConnection;
}

const GetSessions = gql`
     query allSessions($pagination: Pagination!, $filter: QueryFilter, $orderBy: OrderBy) {
        sessions(pagination:$pagination,filter:$filter,orderBy:$orderBy) {
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
                createdAt
                lastInteractionAt
                role
                active
                duration
                instanceSession {
                    id
                    instance {
                        id
                        name
                    }
                    current
                }
                sessionId
                user {
                    id
                    fullName
                    firstName
                    lastName
                }
            }

        }
    }
`;

@Injectable()
export class SessionService {

    constructor(private apollo: Apollo) {
    }

    public getSessions(pagination: Pagination, filter: QueryFilter, orderBy: OrderBy): Promise<InstanceSessionMemberConnection> {
        return this.apollo.watchQuery<SessionsQueryResponse>({
            query: GetSessions,
            variables: {pagination, filter, orderBy},
        }).result()
            .then(({data}) => {
                return data.sessions;
            }).catch((error) => {
                throw new Error(error);
            });
    }

}
