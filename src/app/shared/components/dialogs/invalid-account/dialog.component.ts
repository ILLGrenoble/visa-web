import {Component, OnInit} from '@angular/core';
import {AuthenticationService, ConfigService, Configuration} from '@core';

@Component({
    selector: 'visa-invalid-account-dialog',
    templateUrl: 'dialog.component.html',
})
export class InvalidAccountDialogComponent implements OnInit  {
    public contactEmail;

    constructor(private _authenticationService: AuthenticationService,
        private configService: ConfigService) {

    }

    public ngOnInit(): void {
        this.configService.load().then(config => {
            this.contactEmail = config.contactEmail;
        });
    }

    public handleLogout(): void {
        this._authenticationService.logout();
    }

}
