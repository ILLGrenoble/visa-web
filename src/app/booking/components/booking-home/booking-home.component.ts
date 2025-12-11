import {Component, OnInit} from '@angular/core';
import {BookingRequest, BookingService} from "../../../core";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

@Component({
    selector: 'visa-booking-home',
    templateUrl: './booking-home.component.html',
    styleUrls: ['./booking-home.component.scss'],
})
export class BookingHomeComponent implements OnInit {

    private _loading = false;
    private _bookings: BookingRequest[] = [];
    private _destroy$: Subject<boolean> = new Subject<boolean>();


    get loading(): boolean {
        return this._loading;
    }

    get bookings(): BookingRequest[] {
        return this._bookings;
    }

    constructor(private _bookingService: BookingService) {
    }

    ngOnInit() {
        this._loading = true;
        this._bookingService.getBookingRequests()
            .pipe(takeUntil(this._destroy$))
            .subscribe(bookings => {
                this._loading = false;
                this._bookings = bookings;
            })

    }
}
