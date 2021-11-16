import {Component, OnInit} from '@angular/core';
import {AuthenticationService, ConfigService} from '@core';

@Component({
    selector: 'visa-invalid-account-dialog',
    templateUrl: 'dialog.component.html',
})
export class InvalidAccountDialogComponent implements OnInit {
    private _contactEmail: string;

    get contactEmail(): string {
        return this._contactEmail;
    }

    set contactEmail(value: string) {
        this._contactEmail = value;
    }

    constructor(private _authenticationService: AuthenticationService,
                private _configService: ConfigService) {
    }

    public ngOnInit(): void {
        this._configService.load().then(config => {
            this._contactEmail = config.contactEmail;
        });
    }

    public handleLogout(): void {
        this._authenticationService.logout();
    }

}
