import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {delay, filter, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {Hypervisor, DevicePool, Flavour, CloudClient} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-hypervisors',
    templateUrl: './hypervisors.component.html',
    styleUrls: ['./hypervisors.component.scss'],
})
export class HypervisorsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _allHypervisors: Hypervisor[] = [];
    private _hypervisors: Hypervisor[] = [];
    private _cloudClients: CloudClient[] = [];
    private _devicePools: DevicePool[] = [];
    private _flavours: Flavour[] = [];
    private _loading: boolean;
    private _multiCloudEnabled = false;
    private _selectedCloudClient$: BehaviorSubject<CloudClient> = new BehaviorSubject<CloudClient>(null);

    constructor(private readonly _apollo: Apollo,
                private readonly _titleService: Title) {
    }

    get loading(): boolean {
        return this._loading;
    }

    get hypervisors(): Hypervisor[] {
        return this._hypervisors;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }

    get devicePools(): DevicePool[] {
        return this._devicePools;
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    get selectedCloudClient(): CloudClient {
        return this._selectedCloudClient$.value;
    }

    set selectedCloudClient(value: CloudClient) {
        this._selectedCloudClient$.next(value);
    }


    public ngOnInit(): void {
        this._titleService.setTitle(`Hypervisors | Cloud | Admin | VISA`);
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query hypervisors {
                            hypervisors {
                                id
                                computeId
                                hostname
                                state
                                status
                                cloudId
                                resources {
                                    resourceClass
                                    total
                                    usage
                                }
                            }
                            devicePools {
                                name
                                resourceClass
                            }
                            flavours {
                                id
                                name
                                memory
                                cpu
                                devices {
                                    devicePool {
                                        id
                                        name
                                        resourceClass
                                    }
                                    unitCount
                                }
                            }
                            cloudClients {
                                id
                                name
                            }
                        }
                    `
                })),
                map(({data}) => ({hypervisors: data.hypervisors, cloudClients: data.cloudClients, devicePools: data.devicePools, flavours: data.flavours})),
                tap(() => this._loading = false)
            )
            .subscribe(({hypervisors, cloudClients, devicePools, flavours}) => {
                this._allHypervisors = hypervisors;
                this._cloudClients = cloudClients;
                this.selectedCloudClient = this._cloudClients[0];
                this._devicePools = devicePools;
                this._flavours = flavours;

                this._multiCloudEnabled = cloudClients.length > 1 || hypervisors
                    .map((hypervisors) => hypervisors.cloudId || 0)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
            });

        this._selectedCloudClient$.pipe(
            takeUntil(this._destroy$),
            filter(value => !!value),
        ).subscribe(cloudClient => {
            this._hypervisors = this._allHypervisors.filter(hypervisor => hypervisor.cloudId == cloudClient.id);
        })
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this._refresh$.next();
    }
}
