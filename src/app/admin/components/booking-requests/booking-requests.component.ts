import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import gql from "graphql-tag";
import {map, takeUntil, tap} from "rxjs/operators";
import {BookingRequest, Flavour, FlavourAvailabilitiesFuture} from "../../../core/graphql";
import {EventsGateway, GatewayEventSubscriber} from "../../../core";


@Component({
    selector: 'visa-admin-booking-requests',
    templateUrl: './booking-requests.component.html',
    styleUrls: ['./booking-requests.component.scss'],
})
export class BookingRequestsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;
    private _availabilityLoading: boolean;
    private _gatewayEventSubscriber: GatewayEventSubscriber;

    private _allBookingRequests: BookingRequest[];
    private _pendingBookingRequests: BookingRequest[];
    private _acceptedBookingRequests: BookingRequest[];
    private _availabilities: FlavourAvailabilitiesFuture[] = [];

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title,
                private readonly _eventsGateway: EventsGateway) {
    }

    get loading(): boolean {
        return this._loading;
    }

    get allBookingRequests(): BookingRequest[] {
        return this._allBookingRequests;
    }

    get pendingBookingRequests(): BookingRequest[] {
        return this._pendingBookingRequests;
    }

    get acceptedBookingRequests(): BookingRequest[] {
        return this._acceptedBookingRequests;
    }

    get availabilities(): FlavourAvailabilitiesFuture[] {
        return this._availabilities;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Requests | Bookings | Admin | VISA`);
        this._load();
        this._bindEventGatewayListeners();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
        this._unbindEventGatewayListeners();
    }

    private _load(): void {
        this._loading = true;
        this._apollo.query<any>({
            query: gql`
                query bookingRequests {
                    bookingRequests {
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
                        }
                        state
                        flavours {
                            id
                            flavour {
                                id
                                name
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
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
            tap(() => this._loading = false)
        ).subscribe(({bookingRequests}) => {
            this._allBookingRequests = bookingRequests;
            this._pendingBookingRequests = bookingRequests.filter(bookingRequest => bookingRequest.state === 'CREATED');
            this._acceptedBookingRequests = bookingRequests.filter(bookingRequest => bookingRequest.state === 'ACCEPTED');

            const flavourIds = bookingRequests
                .flatMap(bookingRequest => bookingRequest.flavours).map(flavourRequest => flavourRequest.flavour.id)
                .filter((value, index, array) => array.indexOf(value) === index);

            if (flavourIds.length > 0) {
                this._getFlavourAvailabilities(flavourIds);
            }
        });
    }

    private _getFlavourAvailabilities(flavourIds: number[]): void {
        this._availabilityLoading = true;
        this._apollo.query<any>({
            query: gql`
                query flavourAvailabilitiesFutures($flavourIds: [Int]) {
                    flavourAvailabilitiesFutures(flavourIds: $flavourIds) {
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
                flavourIds,
            },
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
            tap(() => this._availabilityLoading = false)
        ).subscribe(({flavourAvailabilitiesFutures}) => {
            this._availabilities = flavourAvailabilitiesFutures;
        });

    }

    private _bindEventGatewayListeners(): void {
        this._gatewayEventSubscriber = this._eventsGateway.subscribe()
            .on('admin:booking_requests_changed', _ => {
                this._load();
            });
    }

    private _unbindEventGatewayListeners(): void {
        if (this._gatewayEventSubscriber != null) {
            this._eventsGateway.unsubscribe(this._gatewayEventSubscriber);
            this._gatewayEventSubscriber = null;
        }
    }
}
