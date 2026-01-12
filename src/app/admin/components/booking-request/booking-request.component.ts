import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subject} from "rxjs";
import gql from "graphql-tag";
import {map, takeUntil, tap} from "rxjs/operators";
import {Apollo} from "apollo-angular";
import {NotifierService} from "angular-notifier";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute} from "@angular/router";
import {BookingRequest, FlavourAvailabilitiesFuture, Flavour} from "../../../core/graphql";
import {id} from "@cds/core/internal";

@Component({
    selector: 'visa-admin-booking-request',
    templateUrl: './booking-request.component.html',
    styleUrls: ['./booking-request.component.scss'],
})
export class BookingRequestComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;
    private _availabilityLoading: boolean;

    private _bookingRequest: BookingRequest;
    private _availabilities: FlavourAvailabilitiesFuture[] = [];

    get loading(): boolean {
        return this._loading;
    }

    get availabilityLoading(): boolean {
        return this._availabilityLoading;
    }

    get bookingRequest(): BookingRequest {
        return this._bookingRequest;
    }

    get availabilities(): FlavourAvailabilitiesFuture[] {
        return this._availabilities;
    }

    constructor(private readonly _apollo: Apollo,
                private route: ActivatedRoute,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title) {
    }

    ngOnInit() {
        const id = +this.route.snapshot.params.id;

        this._titleService.setTitle(`Requests | Bookings | Admin | VISA`);

        this._loading = true;
        this._apollo.query<any>({
            query: gql`
                query bookingRequest($id: Int!) {
                    bookingRequest(id: $id) {
                        id
                        uid
                        name
                        createdAt
                        startDate
                        endDate
                        owner {
                            id
                            firstName
                            lastName
                            fullName
                            email
                            affiliation {
                                name
                            }
                            activeUserRoles {
                                role {
                                    name
                                }
                            }
                            groups {
                                name
                            }
                        }
                        state
                        flavours {
                            id
                            flavour {
                                id
                                name
                                memory
                                cpu
                                devices {
                                    devicePool {
                                        id
                                        name
                                    }
                                    unitCount
                                }
                            }
                            quantity
                        }
                        history {
                            id
                            state
                            actor {
                                fullName
                            }
                            comments
                            date
                        }
                    }
                }
            `,
            variables: {
                id,
            },
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
            tap(() => this._loading = false)
        ).subscribe(({bookingRequest}) => {
            this._bookingRequest = bookingRequest;
            const flavours = this._bookingRequest.flavours.map(flavour => flavour.flavour);
            this._getFlavourAvailabilities(flavours);

        });
    }

    ngOnDestroy() {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    protected creationComment() {
        return this._bookingRequest.history.find(history => history.state === 'CREATED')?.comments;
    }

    protected durationDays() {
        return (new Date(this._bookingRequest.endDate).getTime() - new Date(this._bookingRequest.startDate).getTime()) / (24 * 60 * 60 * 1000);
    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    private _getFlavourAvailabilities(flavours: Flavour[]): void {
        const ids = flavours.map(flavour => flavour.id);
        this._availabilityLoading = true;
        this._apollo.query<any>({
            query: gql`
                query flavourAvailabilitiesFutures($ids: [Int]) {
                    flavourAvailabilitiesFutures(flavourIds: $ids) {
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
                }
            `,
            variables: {
                ids,
            },
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
            tap(() => this._availabilityLoading = false)
        ).subscribe(({flavourAvailabilitiesFutures}) => {
            this._availabilities = flavourAvailabilitiesFutures;
        });

    }
}
