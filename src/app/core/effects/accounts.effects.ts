import {AccountService, BookingService} from '../services';

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {EMPTY, forkJoin, switchMap} from 'rxjs';
import {catchError, map, mergeMap, } from 'rxjs/operators';
import {AccountActions} from '../actions';

@Injectable()
export class AccountEffects {

    public loadAccount$ = createEffect(() => this.actions$.pipe(
        ofType('[Account] Load account'),
        switchMap(() => {
            return forkJoin({
                user: this.accountService.getInformation(),
                bookingConfig: this.bookingService.getConfig()
            })
        }),
        catchError(() => EMPTY),
        map(({user, bookingConfig}) => AccountActions.loadAccountSuccess({user, bookingConfig}))
    ));

    constructor(
        private actions$: Actions,
        private accountService: AccountService,
        private bookingService: BookingService,
    ) {
    }
}
