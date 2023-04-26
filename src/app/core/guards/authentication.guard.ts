import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {AccountActions} from '../actions';
import {AuthenticationService} from '../services';
import {ApplicationState} from '../state';
import {Observable, of} from 'rxjs';
import {selectLoggedInUser} from '../reducers';
import {catchError, filter, switchMap, take, tap} from 'rxjs/operators';
import {User} from '../models';

const getAccountFromStoreOrAPI = (store: Store<ApplicationState>): Observable<User> => {
    return store.select(selectLoggedInUser).pipe(
        tap((user: User) => {
            if (!user) {
                store.dispatch(AccountActions.loadAccount());
            }
        }),
        filter((user: User) => user != null),
        take(1)
    );
}

const isAnonymousRoute = (url: string): boolean => {
    return url.startsWith('/help');
}

const redirectToHome = (router: Router): Promise<boolean> => {
    return router.navigate(['home']);
}

const redirectToLogin = (router: Router, url: string): Promise<boolean> => {
    if (url === '') {
        return router.navigate(['login']);
    } else {
        return router.navigate(['login'], {queryParams: {returnUrl: url}});
    }
}

export const authenticationGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    const router = inject(Router);
    const store = inject(Store<ApplicationState>);
    const authenticationService = inject(AuthenticationService);

    const requiredRoles = route.data.roles;
    const isLoggedIn = authenticationService.isLoggedIn();
    if (isLoggedIn) {
        return getAccountFromStoreOrAPI(store)
            .pipe(
                switchMap((user) => {
                    if (requiredRoles) {
                        if (user.hasAnyRole(requiredRoles)) {
                            return of(true);

                        } else {
                            redirectToHome(router);
                            return of(false);
                        }
                    }
                    return of(true);
                }),
                catchError(() => of(false))
            );

    } else {
        if (isAnonymousRoute(state.url)) {
            return of(true);

        } else {
            redirectToLogin(router, state.url);
            return of(false);
        }
    }

}

