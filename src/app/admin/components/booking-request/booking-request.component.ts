import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subject} from "rxjs";
import gql from "graphql-tag";
import {map, takeUntil, tap} from "rxjs/operators";
import {Apollo} from "apollo-angular";
import {NotifierService} from "angular-notifier";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";
import {BookingRequest, FlavourAvailabilitiesFuture, Flavour, BookingToken, Image} from "../../../core/graphql";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
    selector: 'visa-admin-booking-request',
    templateUrl: './booking-request.component.html',
    styleUrls: ['./booking-request.component.scss'],
})
export class BookingRequestComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _loading: boolean;

    private _bookingRequest: BookingRequest;
    private _availabilities: FlavourAvailabilitiesFuture[] = [];
    private _tokens: BookingToken[] = [];

    private _form = new FormGroup({
        comments: new FormControl('', Validators.compose([Validators.maxLength(2500), Validators.required])),
    });
    private _accepted: boolean = null;

    get loading(): boolean {
        return this._loading;
    }

    get bookingRequest(): BookingRequest {
        return this._bookingRequest;
    }

    get availabilities(): FlavourAvailabilitiesFuture[] {
        return this._availabilities;
    }

    get tokens(): BookingToken[] {
        return this._tokens;
    }

    get form(): FormGroup {
        return this._form;
    }

    get accepted(): boolean {
        return this._accepted;
    }

    set accepted(value: boolean) {
        this._accepted = value;
    }

    constructor(private readonly _apollo: Apollo,
                private _route: ActivatedRoute,
                private _router: Router,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title) {
    }

    ngOnInit() {
        const id = +this._route.snapshot.params.id;

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
        ).subscribe(({bookingRequest}) => {
            this._bookingRequest = bookingRequest;
            const flavours = this._bookingRequest.flavours.map(flavour => flavour.flavour);
            this._getFlavourAvailabilities(flavours);
            if (bookingRequest.state === 'ACCEPTED') {
                this._getTokens();
            }
        });
    }

    ngOnDestroy() {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    protected creationHistory() {
        return this._bookingRequest.history.find(history => history.state === 'CREATED');
    }

    protected acceptedHistory() {
        return this._bookingRequest.history.find(history => history.state === 'ACCEPTED');
    }

    protected refusedHistory() {
        return this._bookingRequest.history.find(history => history.state === 'REFUSED');
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

    protected isAcceptedValue(value: boolean): boolean {
        return this._accepted === value;
    }

    protected setAcceptedValue(value: boolean): void {
        this._accepted = value;
    }

    protected formatImageName(image?: Image): string {
        if (image) {
            return image.version ? `${image.name} (${image.version})` : image.name;
        }
        return null;
    }

    protected submit(): void {
        const comments = this._form.value.comments;
        const data = {
            accepted: this._accepted,
            comments,
        }

        this._apollo.mutate<any>({
            mutation: gql`
                    mutation bookingRequestResponse($id: Int!, $response: BookingRequestResponseInput!){
                        bookingRequestResponse(id:$id, response:$response) {
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
            variables: {id: this._bookingRequest.id, response: data},
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
        ).subscribe({
            next: ({bookingRequestResponse}) => {
                this._notifierService.notify('success', 'Booking request has been successfully modified');
                this._bookingRequest = bookingRequestResponse;
                this._getTokens();
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        })

    }

    private _getFlavourAvailabilities(flavours: Flavour[]): void {
        const ids = flavours.map(flavour => flavour.id);
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
            tap(() => this._loading = false)
        ).subscribe(({flavourAvailabilitiesFutures}) => {
            this._availabilities = flavourAvailabilitiesFutures;
        });

    }

    private _getTokens(): void {
        this._apollo.query<any>({
            query: gql`
                query bookingTokens($bookingRequestId: Int!) {
                    bookingTokens(bookingRequestId: $bookingRequestId) {
                        id
                        uid
                        flavour {
                            name
                        }
                        owner {
                            id
                            firstName
                            lastName
                            fullName
                            affiliation {
                                name
                            }
                        }
                        instance {
                            id
                            name
                            state
                            createdAt
                            plan {
                                image {
                                    name
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                bookingRequestId: this._bookingRequest.id,
            },
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => data),
        ).subscribe(({bookingTokens}) => {
            this._tokens = bookingTokens;
        });

    }
}
