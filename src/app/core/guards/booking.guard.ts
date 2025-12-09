import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {AccountActions} from '../actions';
import {ApplicationState} from '../state';
import {Observable, of} from 'rxjs';
import {selectUserBookingConfiguration} from '../reducers';
import {catchError, filter, switchMap, take, tap} from 'rxjs/operators';
import {BookingUserConfiguration, User} from '../models';

const getUserBookingConfigFromStoreOrAPI = (store: Store<ApplicationState>): Observable<BookingUserConfiguration> => {
    return store.select(selectUserBookingConfiguration).pipe(
        tap((bookingConfig: BookingUserConfiguration) => {
            if (!bookingConfig) {
                store.dispatch(AccountActions.loadAccount());
            }
        }),
        filter((bookingConfig: BookingUserConfiguration) => bookingConfig != null),
        take(1)
    );
}

const redirectToHome = (router: Router): Promise<boolean> => {
    return router.navigate(['home']);
}

export const bookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    const router = inject(Router);
    const store = inject(Store<ApplicationState>);

    return getUserBookingConfigFromStoreOrAPI(store)
        .pipe(
            switchMap((bookingConfig) => {
                if (!bookingConfig.enabled) {
                    redirectToHome(router);
                }
                return of(bookingConfig.enabled);
            }),
            catchError(() => of(false))
        );


}

