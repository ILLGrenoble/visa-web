import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {SocketIOTunnel} from '@illgrenoble/visa-guacamole-common-js';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Experiment, Instance, InstanceSessionMember, Instrument, Member, Paginated, Quota, User} from '../models';
import {InstancesFilterState, toParams} from './filter/instances-filter-state.model';
import {ObjectMapperService} from './object-mapper.service';

@Injectable()
export class AccountService {
    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService) {
    }

    public getInformation(): Observable<User> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account`;
        return this.http.get<any>(url)
            .pipe(map((result) => {
                const data = result.data;
                return this.objectMapper.deserialize(data, User);
            }));
    }

    public getExperiments(pageSize: number = 5,
                          pageNumber = 1,
                          filter: {instrumentId?: number, proposals?: string[], fromYear?: number, toYear?: number, includeOpenData?: boolean, dois?: string[]},
                          orderBy?: { value: string, descending: boolean }): Observable<Paginated<Experiment[]>> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/experiments`;
        let params = new HttpParams();
        if (pageNumber !== null) {
            params = params.append('page', pageNumber.toString());
        }
        if (pageSize !== null) {
            params = params.append('limit', pageSize.toString());
        }
        if (filter && filter.instrumentId) {
            params = params.append('instrumentId', filter.instrumentId.toString());
        }
        if (filter && filter.fromYear) {
            params = params.append('startDate', `${filter.fromYear}-01-01`);
        }
        if (filter && filter.toYear) {
            params = params.append('endDate', `${filter.toYear}-12-31`);
        }
        if (filter && filter.includeOpenData) {
            params = params.append('includeOpenData', 'true');
        }
        if (filter && filter.proposals) {
            params = params.append('proposals', filter.proposals.join(','));
        }
        if (filter && filter.dois) {
            params = params.append('dois', filter.dois.join(','));
        }
        if (orderBy) {
            params = params.append('orderBy', orderBy.value);
            params = params.append('descending', `${orderBy.descending}`);
        }
        return this.http.get<any>(url, {params})
            .pipe(map((response) => {
                const data = response.data;
                const {count, page, limit} = response._metadata;
                const experiments = data.map((experiment) => this.objectMapper.deserialize(experiment, Experiment));
                const errors = response.errors;
                return new Paginated<Experiment[]>(count, page, limit, experiments, errors);
            }));
    }

    public getFilteredInstances(roles: string[], experiments?: string[]): Promise<Instance[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances`;

        let params = new HttpParams();
        params = params.append('roles', roles.join(','));
        if (experiments) {
            params = params.append('experiments', experiments.join(''));
        }
        return this.http.get<any>(url, {
            params
        }).pipe(map((response) => {
            const instances = response.data;
            return instances.map((instance) => this.objectMapper.deserialize(instance, Instance));
        })).toPromise();
    }

    public getInstances(): Promise<Instance[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances`;
        return this.http.get<any>(url).pipe(map((response) => {
            const instances = response.data;
            return instances.map((instance) => this.objectMapper.deserialize(instance, Instance));
        })).toPromise();
    }

    public getExperimentsForInstances(): Observable<Experiment[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/experiments`;
        return this.http.get<any>(url).pipe(map((response) => {
            const experiments = response.data;
            return experiments.map((experiment) => this.objectMapper.deserialize(experiment, Experiment));
        }));
    }

    public getCountInstances(): Observable<number> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/_count`;
        return this.http.get<any>(url).pipe(map((response) => response.data));
    }

    public getInstancesForSupport(filter: InstancesFilterState): Observable<Paginated<Instance[]>> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/support`;
        const params = toParams(filter);

        return this.http.get<any>(url, {params}).pipe(map((response) => {
            const data = response.data;
            const {count, page, limit} = response._metadata;
            const instances = data.map((instance) => this.objectMapper.deserialize(instance, Instance));
            return new Paginated<Instance[]>(count, page, limit, instances);
        }));
    }

    public getInstance(uid: string): Promise<Instance> {
        return new Promise<Instance>((resolve, reject) => {
            const baseUrl = environment.paths.api;
            const url = `${baseUrl}/account/instances/${uid}`;
            return this.http.get<any>(url).toPromise()
                .then((response) => {
                    const instance = response.data;
                    resolve(this.objectMapper.deserialize(instance, Instance));
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    public getInstruments(): Observable<Instrument[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/experiments/instruments`;
        return this.http.get<any>(url).pipe(map((response) => {
            const instruments = response.data;
            return instruments.map((instrument) => this.objectMapper.deserialize(instrument, Instrument));
        }));
    }

    public getExperimentYears(): Observable<number[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/experiments/years`;
        return this.http.get<any>(url).pipe(map((response) => {
            const years = response.data;
            return years;
        }));
    }

    public getMembersForInstance(instance: Instance): Observable<Member[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/members`;
        return this.http.get<any>(url).pipe(map((response) => {
            const data = response.data;
            return data.map((member) => this.objectMapper.deserialize(member, Member));
        }));
    }

    public getSessionMembersForInstance(instance: Instance): Observable<InstanceSessionMember[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/sessions/active/members`;
        return this.http.get<any>(url).pipe(map((response) => {
            const data = response.data;
            return data.map((member) => this.objectMapper.deserialize(member, InstanceSessionMember));
        }));
    }

    public createMemberForInstance(instance: Instance, member: Member): Observable<Member> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/members`;
        const body = {
            role: member.role,
            userId: member.user.id,
        };
        return this.http.post<any>(url, body).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(member, Member);
        }));
    }

    public updateMemberForInstance(instance: Instance, member: Member): Observable<Member> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/members/${member.id}`;
        const body = {
            role: member.role,
        };
        return this.http.put<any>(url, body).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Member);
        }));
    }

    public deleteMemberFromInstance(instance: Instance, member: Member): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/members/${member.id}`;
        return this.http.delete<any>(url).pipe(map((res) => {
            return null;
        }));
    }

    public getUsersByLastName(lastName: string): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/users/_search?name=${lastName}`;
        return this.http.get<any>(url).pipe(map((res) => res.data));
    }

    public getUserById(id: number): Observable<User> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/users/${id}`;
        return this.http.get<any>(url).pipe(map((res) => res.data));
    }

    public getExperimentalTeamForInstance(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/experiments/team`;
        return this.http.get<any>(url).pipe(map((res) => res));
    }

    public getScientificSupportUsers(): Observable<User[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/users/support`;
        return this.http.get<any>(url).pipe(map((response) => {
            const users = response.data;
            return users.map((user) => this.objectMapper.deserialize(user, User));
        }));
    }

    public createInstance(instance: Instance, acceptedTerms = false): Observable<Instance> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances`;
        const body = {
            acceptedTerms,
            comments: instance.comments,
            experiments: instance.experiments.map((experiment) => experiment.id),
            name: instance.name,
            planId: instance.plan.id,
            screenHeight: instance.screenHeight,
            screenWidth: instance.screenWidth,
            keyboardLayout: instance.keyboardLayout
        };
        return this.http.post<any>(url, body).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Instance);
        }));
    }

    public updateInstance(instance: Instance, newData: any): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}`;
        return this.http.put<any>(url, newData).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Instance);
        }));
    }

    public deleteInstance(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}`;
        return this.http.delete<any>(url).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Instance);
        }));
    }

    public getInstanceState(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/state`;
        return this.http.get<any>(url).pipe(map((response) => {
            return response.data;
        }));
    }

    public instanceReboot(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/actions/reboot`;
        return this.http.post<any>(url, null).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Instance);
        }));
    }

    public instanceShutdown(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/actions/shutdown`;
        return this.http.post<any>(url, null).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Instance);
        }));
    }

    public instanceStart(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/actions/start`;
        return this.http.post<any>(url, null).pipe(map((response) => {
            const data = response.data;
            return this.objectMapper.deserialize(data, Instance);
        }));
    }

    public createInstanceAuthenticationTicket(instance: Instance): Observable<string> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/auth/token`;
        return this.http.post<any>(url, null).pipe(map((response) => {
            const data = response.data;
            return data.token;
        }));
    }

    public createRemoteDesktopTunnel(): SocketIOTunnel {
        const path = environment.paths.vdi;
        const connectionOptions = {
            'force new connection': true,
            forceNew: true,
            path,
            reconnection: false,
            transports: ['websocket'],
        };
        return new SocketIOTunnel(window.location.origin, connectionOptions, 'display');
    }

    public getQuotas(): Observable<Quota> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/quotas`;
        return this.http.get<any>(url).pipe(map((result) => {
            const data = result.data;
            return this.objectMapper.deserialize(data, Quota);
        }));
    }

    public getExperimentCount(): Observable<number> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/experiments/_count`;
        return this.http.get<any>(url).pipe(map((response) => response.data));
    }

    public createThumbnailForInstance(instance: Instance, thumbnail: Blob): Promise<any> {
        const baseUrl = environment.paths.api;
        const formData = new FormData();
        formData.append('file', thumbnail);
        const url = `${baseUrl}/account/instances/${instance.uid}/thumbnail`;
        return this.http.post<FormData>(url, formData).pipe(map((res) => true)).toPromise();
    }

    public getThumbnailUrlForInstance(instance: Instance): string {
        const baseUrl = environment.paths.api;
        return `${baseUrl}/account/instances/${instance.uid}/thumbnail`;
    }

    public getInstanceLifetimeExtension(instance: Instance): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/extension`;
        return this.http.get<any>(url).pipe(map((instanceExtensionRequest) => {
            return instanceExtensionRequest;
        }));
    }

    public requestInstanceLifetimeExtension(instance: Instance, comments: string): Observable<any> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/instances/${instance.uid}/extension`;
        return this.http.post<any>(url, {comments}).pipe(map((instanceExtensionRequest) => {
            return instanceExtensionRequest;
        }));

    }
}
