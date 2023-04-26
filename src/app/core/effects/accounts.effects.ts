import {AccountService} from '../services';

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {EMPTY} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {AccountActions} from '../actions';

@Injectable()
export class AccountEffects {

    public loadAccount$ = createEffect(() => this.actions$.pipe(
        ofType('[Account] Load account'),
        mergeMap(() => this.accountService.getInformation()
            .pipe(
                map((user) => AccountActions.loadAccountSuccess({user})),
                catchError(() => EMPTY),
            )),
        ),
    );

    constructor(
        private actions$: Actions,
        private accountService: AccountService,
    ) {
    }
}
