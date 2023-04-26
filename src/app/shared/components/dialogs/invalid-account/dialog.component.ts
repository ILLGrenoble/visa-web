import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService, ConfigService} from '@core';
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

@Component({
    selector: 'visa-invalid-account-dialog',
    templateUrl: 'dialog.component.html',
})
export class InvalidAccountDialogComponent implements OnInit, OnDestroy {
    private _contactEmail: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

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
        this._configService.load()
            .pipe(takeUntil(this._destroy$))
            .subscribe((config) => {
                this._contactEmail = config.contactEmail;
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public handleLogout(): void {
        this._authenticationService.logout();
    }

}
