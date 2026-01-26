import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {CloudClient, NumberInstancesByCloudClient} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-cloud-clients',
    templateUrl: './cloud-clients.component.html',
})

export class CloudClientsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _cloudClients: CloudClient[] = [];
    private _instanceCounts: NumberInstancesByCloudClient[] = [];
    private _loading: boolean;

    private _modalData$ = new Subject<{ cloudClient: CloudClient, clone: boolean, readonly: boolean }>();
    private _cloudClientToDelete: CloudClient;

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title) {
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }
    public onRefresh(): void {
        this._refresh$.next();
    }

    get modalData$(): Subject<{ cloudClient: CloudClient; clone: boolean; readonly: boolean }> {
        return this._modalData$;
    }

    get cloudClientToDelete(): CloudClient {
        return this._cloudClientToDelete;
    }

    get showDeleteModal(): boolean {
        return this._cloudClientToDelete != null;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Providers | Cloud | Admin | VISA`);
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query allCloudClients {
                            cloudClients {
                                id
                                name
                                type
                                serverNamePrefix
                                visible
                                openStackProviderConfiguration {
                                    applicationId
                                    applicationSecret
                                    computeEndpoint
                                    placementEndpoint
                                    imageEndpoint
                                    networkEndpoint
                                    identityEndpoint
                                    addressProvider
                                    addressProviderUUID
                                }
                                webProviderConfiguration {
                                    url
                                    authToken
                                }
                            }
                            countInstancesByCloudClients {
                                id
                                name
                                total
                            }
                        }
                    `
                })),
                map(({data}) => ({cloudClients: data.cloudClients, instanceCounts: data.countInstancesByCloudClients})),
                tap(() => this._loading = false)
            )
            .subscribe(({cloudClients, instanceCounts}) => {
                this._cloudClients = cloudClients;
                this._instanceCounts = instanceCounts;
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public canModify(cloudClient: CloudClient): boolean {
        return cloudClient.id != null && cloudClient.id !== -1;
    }

    public onCreate(cloudClient?: CloudClient): void {
        this.modalData$.next({cloudClient: cloudClient, clone: !!cloudClient, readonly: false});
    }

    public onDelete(cloudClient: CloudClient): void {
        this._cloudClientToDelete = cloudClient;
    }

    public onConfirmDelete(): void {
        if (this._cloudClientToDelete) {
            this._apollo.mutate({
                    mutation: gql`
                        mutation DeleteCloudClient($id: Int!){
                            deleteCloudClient(id: $id)
                        }
                    `,
                    variables: {id: this._cloudClientToDelete.id},
                }).pipe(
                    takeUntil(this._destroy$)
                ).subscribe({
                next: () => {
                    this._cloudClientToDelete = null;
                    this._notifierService.notify('success', 'Successfully deleted cloud provider');
                    this._refresh$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }
    }

    public onUpdate(cloudClient: CloudClient): void {
        this.modalData$.next({cloudClient: cloudClient, clone: false, readonly: false});
    }

    public onView(cloudClient: CloudClient): void {
        this.modalData$.next({cloudClient: cloudClient, clone: false, readonly: true});
    }

    public onDeleteModalClosed(): void {
        this._cloudClientToDelete = null;
    }

    public onCloudClientSaved(): void {
        this._refresh$.next();
    }

    public instanceCount(cloudClient: CloudClient): number {
        const counter = this._instanceCounts.find(instanceCount => instanceCount.id === cloudClient.id);
        return counter ? counter.total : 0;
    }

}
