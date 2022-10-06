import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {lastValueFrom, Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {CloudClient, CloudClientInput, NumberInstancesByCloudClient} from '../../../core/graphql';
import {CloudClientEditComponent} from '../cloud-client-edit';
import {CloudClientDeleteComponent} from '../cloud-client-delete';

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

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _dialog: MatDialog,
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
        const dialogRef = this._dialog.open(CloudClientEditComponent, {
            width: '900px',
            data: {cloudClient, clone: !!cloudClient}
        });

        dialogRef.componentInstance.onSave$.subscribe((input: CloudClientInput) => {
            const source$ = this._apollo.mutate<any>({
                mutation: gql`
                        mutation CreateCloudClient($input: CloudClientInput!){
                            createCloudClient(input: $input) {
                              id
                              name
                            }
                        }
                    `,
                variables: {input},
            }).pipe(
                takeUntil(this._destroy$)
            );
            lastValueFrom(source$).then(() => {
                this._notifierService.notify('success', 'Cloud provider created');
                this._refresh$.next();
                dialogRef.close();
            }).catch((error) => {
                this._notifierService.notify('error', error);
            });
        });
    }

    public onDelete(cloudClient: CloudClient): void {

        const dialogRef = this._dialog.open(CloudClientDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const source$ = this._apollo.mutate({
                    mutation: gql`
                        mutation DeleteCloudClient($id: Int!){
                            deleteCloudClient(id: $id)
                        }
                    `,
                    variables: {id: cloudClient.id},
                }).pipe(
                    takeUntil(this._destroy$)
                );
                lastValueFrom(source$).then(_ => {
                    this._notifierService.notify('success', 'Successfully deleted cloud provider');
                    this._refresh$.next();
                }).catch((error) => {
                    this._notifierService.notify('error', error);
                });
            }
        });
    }

    public onUpdate(cloudClient: CloudClient): void {
        const dialogRef = this._dialog.open(CloudClientEditComponent, {
            width: '900px',
            data: {cloudClient}
        });

        dialogRef.componentInstance.onSave$.subscribe((input: CloudClientInput) => {
            const source$ = this._apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateCloudClient($id: Int!,$input: CloudClientInput!){
                        updateCloudClient(id: $id, input: $input) {
                            id
                        }
                    }
                    `,
                variables: {id: cloudClient.id, input},
            }).pipe(
                takeUntil(this._destroy$)
            );
            lastValueFrom(source$).then(() => {
                this._notifierService.notify('success', 'Cloud provider saved');
                this._refresh$.next();
                dialogRef.close();
            }).catch((error) => {
                this._notifierService.notify('error', error);
            });
        });
    }

    public onView(cloudClient: CloudClient): void {
        const dialogRef = this._dialog.open(CloudClientEditComponent, {
            width: '900px',
            data: {cloudClient, clone: false, readonly: true}
        });
    }

    public instanceCount(cloudClient: CloudClient): number {
        const counter = this._instanceCounts.find(instanceCount => instanceCount.id === cloudClient.id);
        return counter ? counter.total : 0;
    }

}
