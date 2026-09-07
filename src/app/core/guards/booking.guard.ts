import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {AccountActions} from '../actions';
import {ApplicationState} from '../state';
import {Observable, of} from 'rxjs';
import {selectAccountBookingAccess} from '../reducers';
import {catchError, filter, switchMap, take, tap} from 'rxjs/operators';
import {AccountBookingAccess} from '../models';

const getAccountBookingAccessFromStoreOrAPI = (store: Store<ApplicationState>): Observable<AccountBookingAccess> => {
    return store.select(selectAccountBookingAccess).pipe(
        tap((bookingAccess: AccountBookingAccess) => {
            if (!bookingAccess) {
                store.dispatch(AccountActions.loadAccount());
            }
        }),
        filter(bookingAccess => !!bookingAccess),
        take(1)
    );
}

const redirectToHome = (router: Router): Promise<boolean> => {
    return router.navigate(['home']);
}

export const bookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    const router = inject(Router);
    const store = inject(Store<ApplicationState>);

    return getAccountBookingAccessFromStoreOrAPI(store)
        .pipe(
            switchMap((bookingAccess) => {
                if (!bookingAccess.owner && !bookingAccess.organiser) {
                    redirectToHome(router);
                }
                return of(bookingAccess.owner || bookingAccess.organiser);
            }),
            catchError(() => of(false))
        );


}

