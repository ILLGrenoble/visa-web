import {Component, OnInit } from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';

@Component({
    selector: 'visa-booking-admin-header',
    styleUrls: ['./booking-header.component.scss'],
    templateUrl: './booking-header.component.html',
})
export class BookingHeaderComponent implements OnInit {

    constructor(private router: Router, private titleService: Title) {
        this.router = router;
    }

    public ngOnInit(): void {
        if (!this.titleService.getTitle().endsWith(`Bookings | Admin | VISA`)) {
            this.titleService.setTitle(`Bookings | Admin | VISA`);
        }
    }
}
