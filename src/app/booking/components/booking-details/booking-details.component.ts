import {Component, OnInit} from '@angular/core';
import {BookingRequest, BookingService, BookingToken, Flavour} from "../../../core";
import {forkJoin, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {ActivatedRoute, Router} from "@angular/router";
import {NotifierService} from "angular-notifier";

@Component({
    selector: 'visa-booking-details',
    templateUrl: './booking-details.component.html',
    styleUrls: ['./booking-details.component.scss'],
})
export class BookingDetailsComponent implements OnInit {

    private _loading = false;
    private _booking: BookingRequest;
    private _tokens: BookingToken[];
    private _error: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _showDeleteModal = false;
    private _sendingDeleteRequest = false;


    get loading(): boolean {
        return this._loading;
    }

    get booking(): BookingRequest {
        return this._booking;
    }

    get error(): string {
        return this._error;
    }

    get showDeleteModal(): boolean {
        return this._showDeleteModal;
    }

    get sendingDeleteRequest(): boolean {
        return this._sendingDeleteRequest;
    }

    get bookingStatus(): string {
        if (this._booking.state == 'CREATED') {
            return 'The request is pending approval';
        } else if (this._booking.state == 'ACCEPTED') {
            // Check dates to see if active
            return 'The request has been accepted';
        } else if (this._booking.state == 'REFUSED') {
            return 'The request has been refused';
        }
    }

    constructor(private _route: ActivatedRoute,
                private _notifierService: NotifierService,
                private _router: Router,
                private _bookingService: BookingService) {
    }

    ngOnInit() {
        const uid = this._route.snapshot.paramMap.get('uid');

        this._loading = true;

        forkJoin({
                booking: this._bookingService.getBookingRequest(uid),
                tokens: this._bookingService.getBookingRequestTokens(uid),
            }).pipe(takeUntil(this._destroy$))
            .subscribe({
                next: ({booking, tokens}) => {
                    this._loading = false;
                    this._booking = booking;
                    this._tokens = tokens;
                },
                error: (error) => {
                    this._loading = false;
                    if (error.status === 404) {
                        this._error = 'The requested reservation request does not exist';

                    } else {
                        this._error = 'Failed to obtain the reservation request';
                    }
                }
            })
    }

    protected getCpuView(flavour: Flavour): string {
        return flavour.cpu + ' Core' + (flavour.cpu !== 1 ? 's' : '');
    }

    protected getRamView(flavour: Flavour): string {
        return (Math.round(flavour.memory / 1024 * 10) / 10) + 'GB';
    }

    protected deleteBookingRequest(): void {
        this._showDeleteModal = true;
    }

    protected confirmDeleteRequest(): void {
        this._sendingDeleteRequest = true;
        this._bookingService.deleteBookingRequest(this._booking.uid)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: () => {
                    this._sendingDeleteRequest = false;
                    this._notifierService.notify('success', 'The instance reservation has been deleted');
                    this._router.navigate(['bookings'], {replaceUrl: true});
                },
            })
    }

    protected closeDeleteModal(): void {
        this._showDeleteModal = false;
    }
}
