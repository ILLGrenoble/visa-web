import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService, ConfigService, Configuration} from '@core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-not-found',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

    private _returnUrl: string;

    private _config: Configuration = null;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get config(): Configuration {
        return this._config;
    }

    set config(value: Configuration) {
        this._config = value;
    }

    constructor(private _authenticationService: AuthenticationService,
                private _route: ActivatedRoute,
                private _router: Router,
                private _configService: ConfigService) {
    }

    public ngOnInit(): void {
        this._configService.configuration$()
            .pipe(takeUntil(this._destroy$))
            .subscribe((config) => {
                this.config = config;
            });
        this._route.queryParams
            .pipe(takeUntil(this._destroy$))
            .subscribe((params) => {
                this._returnUrl = params.returnUrl || '/';
            });
    }

    public handleLogin(): void {
        this._authenticationService.login(this._returnUrl);
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

}
