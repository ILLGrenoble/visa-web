import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import gql from "graphql-tag";
import {map, takeUntil, tap} from "rxjs/operators";
import {BookingRequest} from "../../../core/graphql";


@Component({
    selector: 'visa-admin-booking-requests',
    templateUrl: './booking-requests.component.html',
    styleUrls: ['./booking-requests.component.scss'],
})
export class BookingRequestsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;

    private _pendingBookingRequests: BookingRequest[];
    private _acceptedBookingRequests: BookingRequest[];

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title) {
    }

    get loading(): boolean {
        return this._loading;
    }

    get pendingBookingRequests(): BookingRequest[] {
        return this._pendingBookingRequests;
    }

    get acceptedBookingRequests(): BookingRequest[] {
        return this._acceptedBookingRequests;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Requests | Bookings | Admin | VISA`);

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
                            activeUserRoles {
                                role {
                                    name
                                }
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
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
            tap(() => this._loading = false)
        ).subscribe(({bookingRequests}) => {
            this._pendingBookingRequests = bookingRequests.filter(bookingRequest => bookingRequest.state === 'CREATED');
            this._acceptedBookingRequests = bookingRequests.filter(bookingRequest => bookingRequest.state === 'ACCEPTED');
        });

    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

}
