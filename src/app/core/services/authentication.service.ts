import {Injectable} from '@angular/core';
import {KeycloakEvent, KeycloakEventType, KeycloakService} from 'keycloak-angular';
import {ConfigService} from './config.service';
import {CookieService} from 'ngx-cookie-service';
import {share} from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class AuthenticationService {

    constructor(private _keycloakService: KeycloakService,
                private _configService: ConfigService,
                private _cookieService: CookieService) {
    }

    public initialiseKeycloak(): () => Promise<any> {
        return (): Promise<any> => {
            return new Promise(async (resolve, reject) => {
                try {
                    // Make sure config is loaded from server
                    const config = await this._configService.load();
                    const keycloakConfig = config.login;
                    const handleAuthError = () => {
                        this._cookieService.delete('access_token');
                        this._keycloakService.logout();
                    };

                    this._keycloakService.keycloakEvents$.pipe(share()).subscribe((event: KeycloakEvent) => {
                        if ([
                            KeycloakEventType.OnAuthSuccess, event.type,
                            KeycloakEventType.OnAuthRefreshSuccess
                        ].includes(event.type)) {
                            this._keycloakService.getToken().then((token: string) => {
                                this._cookieService.set('access_token', token, undefined, '/');
                            });
                        } else if ([
                            KeycloakEventType.OnAuthError,
                            KeycloakEventType.OnAuthRefreshError,
                            KeycloakEventType.OnAuthLogout,
                            KeycloakEventType.OnTokenExpired
                        ].includes(event.type)) {
                            handleAuthError();
                        }
                    });

                    await this._keycloakService.init({
                        bearerExcludedUrls: ['/api/docs/(.*)+', '/api/configuration', '/api/notifications'],
                        config: keycloakConfig,
                        initOptions: {
                            checkLoginIframe: false,
                            onLoad: 'check-sso',
                        },
                    });

                    this._keycloakService.getKeycloakInstance().onAuthRefreshError = handleAuthError;
                    this._keycloakService.getKeycloakInstance().onAuthError = handleAuthError;

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        };
    }

    public login(url): Promise<void> {
        const options = {
            redirectUri: window.origin + url,
        };
        return this._keycloakService.login(options);
    }

    public logout(): void {
        this._keycloakService.logout();
    }

    public isLoggedIn(): Promise<boolean> {
        return this._keycloakService.isLoggedIn();
    }
}
