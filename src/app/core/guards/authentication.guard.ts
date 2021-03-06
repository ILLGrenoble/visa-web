import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {AccountActions} from '../actions';
import {AuthenticationService} from '../services';
import {ApplicationState} from '../state';
import {Observable, of} from 'rxjs';
import {selectLoggedInUser} from '../reducers';
import {catchError, filter, switchMap, take, tap} from 'rxjs/operators';
import {User} from '../models';

@Injectable()
export class AuthenticationGuard implements CanActivate {

    constructor(private _authenticationService: AuthenticationService,
                private _router: Router,
                private _store: Store<ApplicationState>) {
    }

    private getAccountFromStoreOrAPI(): Observable<User> {
        return this._store
            .select(selectLoggedInUser).pipe(tap((user: User) => {
                    if (!user) {
                        this._store.dispatch(AccountActions.loadAccount());
                    }
                }),
                filter((user: User) => user != null),
                take(1)
            );
    }

    public isAnonymousRoute(url: string): boolean {
        return url.startsWith('/help');
    }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const requiredRoles = route.data.roles;
        const isLoggedIn = this._authenticationService.isLoggedIn();
        if (isLoggedIn) {
            return this.getAccountFromStoreOrAPI()
                .pipe(switchMap((user) => {
                    if (requiredRoles) {
                        if (user.hasAnyRole(requiredRoles)) {
                            return of(true);
                        } else {
                            this.redirectToHome();
                            return of(false);
                        }
                    }
                    return of(true);
                }), catchError(() => of(false)));
        } else {
            if (this.isAnonymousRoute(state.url)) {
                return of(true);
            } else {
                this.redirectToLogin(state.url);
                return of(false);
            }
        }
    }

    private redirectToHome(): void {
        this._router.navigate(['home']);
    }

    private redirectToLogin(url: string): void {
        if (url === '') {
            this._router.navigate(['login']);
        } else {
            this._router.navigate(['login'], {queryParams: {returnUrl: url}});
        }
    }

}
