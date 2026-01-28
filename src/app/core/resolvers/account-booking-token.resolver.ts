import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {Observable} from 'rxjs';
import {BookingService} from '../services';
import {BookingToken} from "../models";

export const accountBookingTokenResolver: ResolveFn<Observable<BookingToken>> = (route: ActivatedRouteSnapshot) => {
    const bookingService = inject(BookingService);
    const bookingTokenUid = route.paramMap.get('tokenUid');
    return bookingService.getAssignedBookingTokenByUid(bookingTokenUid);
}

