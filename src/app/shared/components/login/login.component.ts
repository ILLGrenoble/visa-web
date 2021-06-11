import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService, ConfigService, Configuration} from '@core';
import {Subscription} from 'rxjs';

@Component({
    selector: 'visa-not-found',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

    public returnUrl;
    private queryParamsSubscription: Subscription;
    private _config: Configuration = null;

    get config(): Configuration {
        return this._config;
    }

    set config(value: Configuration) {
        this._config = value;
    }

    constructor(private authenticationService: AuthenticationService,
                private route: ActivatedRoute,
                private router: Router,
                private configService: ConfigService) {
    }

    public ngOnInit(): void {
        this.configService.load().then(config => {
            this.config = config;
        });
        this.queryParamsSubscription = this.route.queryParams
            .subscribe((params) => {
                this.returnUrl = params.returnUrl || '/';
            });
        if (this.authenticationService.isLoggedIn().then((isLoggedIn) => {
            if (isLoggedIn) {
                this.router.navigateByUrl('/');
            }
        })) {
        }
    }

    public handleLogin(): void {
        this.authenticationService.login(this.returnUrl);
    }

    public ngOnDestroy(): void {
        this.queryParamsSubscription.unsubscribe();
    }
}
