import {Injectable} from '@angular/core';
import {ConfigService} from './config.service';
import {CookieService} from 'ngx-cookie-service';
import {OAuthEvent, OAuthService, OAuthSuccessEvent} from 'angular-oauth2-oidc';
import {JwksValidationHandler} from 'angular-oauth2-oidc-jwks';
import {filter, map, switchMap, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {ApplicationState} from '../state';
import {AccountActions} from '../actions';
import {from, Observable} from "rxjs";


export function authenticationServiceInitializerFactory(authenticationService: AuthenticationService): () => Observable<void> {
    return () => authenticationService.init();
}

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {

    constructor(private _oauthService: OAuthService,
                private _configService: ConfigService,
                private _cookieService: CookieService,
                private _store: Store<ApplicationState>,
                private _router: Router) {

        this._oauthService.events
            .pipe(filter(event => event.type === 'logout'))
            .subscribe(async () => {
                const currentUrl = this._router.url;
                const redirectUrl = `/login?returnUrl=${currentUrl}`;
                this._router.navigateByUrl(redirectUrl).then(() => {
                    this._store.dispatch(AccountActions.clearAccount());
                    this._removeCookie();
                });
            });

        this._oauthService.events
            .pipe(filter(event => event.type === 'token_received'))
            .subscribe((event: OAuthEvent) => {
                if (event instanceof OAuthSuccessEvent) {
                    this._redirectToPreviousUrl();
                    this._updateCookie();
                }
            });
    }

    private _updateCookie(): void {
        const accessToken = this._oauthService.getAccessToken();
        const accessTokenExpiration = new Date(this._oauthService.getAccessTokenExpiration());
        const isHttps = this._isHttps();
        this._cookieService.set('access_token', accessToken, accessTokenExpiration, '/', undefined, isHttps, 'Strict');
    }

    private _removeCookie(): void {
        this._cookieService.delete('access_token');
    }

    private _isHttps(): boolean {
        return document.location.protocol === 'https:';
    }

    private _redirectToPreviousUrl(): void {
        const state = this._oauthService.state;
        if (state) {
            const redirectUrl = decodeURIComponent(state);
            if (redirectUrl) {
                this._router.navigateByUrl(redirectUrl).then(() => {
                    this._oauthService.state = null;
                });
            }
        }
    }

    public init(): Observable<void> {
        this._removeCookie();

        return this._configService.load().pipe(
            map(config => ({
                ...config.login,
                redirectUri: `${window.location.origin}/home`,
                postLogoutRedirectUri: `${window.location.origin}/login`,
                responseType: 'code'
            })),
            tap(authConfig => {
                this._oauthService.configure(authConfig);
                this._oauthService.setStorage(localStorage);
                this._oauthService.tokenValidationHandler = new JwksValidationHandler();
            }),
            switchMap(() => from(this._oauthService.loadDiscoveryDocumentAndTryLogin())),
            filter(isLoggedIn => isLoggedIn),
            map(() => {
                this._updateCookie();
                this._oauthService.setupAutomaticSilentRefresh();
            })
        );
    }

    public login(url): Promise<void> {
        return this._oauthService.loadDiscoveryDocument().then(() => {
            this._oauthService.tryLogin().then(() => {
                this._oauthService.initCodeFlow(url);
            });
        });
    }

    public logout(): void {
        this._oauthService.logOut();
    }

    public isLoggedIn(): boolean {
        const isTokenExpired = this._oauthService.getAccessTokenExpiration() <= new Date().getTime();
        return this._oauthService.getAccessToken() != null && !isTokenExpired;
    }

}
