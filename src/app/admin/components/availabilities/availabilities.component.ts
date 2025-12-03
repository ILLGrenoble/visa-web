import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, min, Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {delay, filter, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {CloudClient, FlavourAvailabilitiesFuture} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-availabilities',
    templateUrl: './availabilities.component.html',
    styleUrls: ['./availabilities.component.scss'],
})
export class AvailabilitiesComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _resetCharts$: Subject<void> = new Subject();
    private _resetDisabled = true;
    private _allAvailabilities: FlavourAvailabilitiesFuture[] = [];
    private _availabilities: FlavourAvailabilitiesFuture[] = [];
    private _cloudClients: CloudClient[] = [];
    private _loading: boolean;
    private _multiCloudEnabled = false;
    private _selectedCloudClient$: BehaviorSubject<CloudClient> = new BehaviorSubject<CloudClient>(null);
    private _axisData$: Subject<{min: number, max: number}> = new Subject<{min: number; max: number}>();

    constructor(private readonly _apollo: Apollo,
                private readonly _titleService: Title) {
    }

    get loading(): boolean {
        return this._loading;
    }

    get availabilities(): FlavourAvailabilitiesFuture[] {
        return this._availabilities;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
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

    get axisData$(): Subject<{ min: number; max: number }> {
        return this._axisData$;
    }

    get resetCharts$(): Subject<void> {
        return this._resetCharts$;
    }

    get resetDisabled(): boolean {
        return this._resetDisabled;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Availabilities | Booking | Admin | VISA`);
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query flavourAvailabilitiesFutures {
                            flavourAvailabilitiesFutures {
                                flavour {
                                    id
                                    name
                                    memory
                                    cpu
                                    cloudId
                                    devices {
                                        devicePool {
                                            id
                                            name
                                            description
                                            resourceClass
                                        }
                                        unitCount
                                    }
                                }
                                confidence
                                availabilities {
                                    date
                                    confidence
                                    availableUnits
                                    totalUnits
                                }
                            }
                            cloudClients {
                                id
                                name
                            }
                        }
                    `
                })),
                map(({data}) => data),
                tap(() => this._loading = false)
            )
            .subscribe(({flavourAvailabilitiesFutures, cloudClients}) => {
                this._allAvailabilities = flavourAvailabilitiesFutures;
                this._cloudClients = cloudClients;
                this.selectedCloudClient = this._cloudClients[0];

                this._multiCloudEnabled = cloudClients.length > 1 || flavourAvailabilitiesFutures
                    .map(flavourAvailabilitiesFuture => flavourAvailabilitiesFuture.flavour)
                    .map(flavour => flavour.cloudId || 0)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
            });

        this._selectedCloudClient$.pipe(
            takeUntil(this._destroy$),
            filter(value => !!value),
        ).subscribe(cloudClient => {
            const cloudId = cloudClient.id == null ? -1 : cloudClient.id;
            this._availabilities = this._allAvailabilities
                .filter(flavourAvailabilitiesFuture => {
                    const flavour = flavourAvailabilitiesFuture.flavour;
                    const flavourCloudId = flavour.cloudId == null ? -1 : flavour.cloudId;
                    return flavourCloudId == cloudId;
                })
        });

        this._axisData$.subscribe(() => {
            this._resetDisabled = false;
        })
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    public resetCharts(): void {
        this._resetDisabled = true;
        this._resetCharts$.next();
    }
}
