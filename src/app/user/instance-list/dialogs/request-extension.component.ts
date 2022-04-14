import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AccountService, Configuration, Instance} from '@core';

@Component({
    selector: 'visa-instance-request-extension-dialog',
    templateUrl: 'request-extension.component.html',
})
// tslint:disable-next-line:component-class-suffix
export class RequestExtensionDialog implements OnInit {

    public _instance: Instance;

    private _configuration: Configuration;

    private _comments: string;

    get instance(): Instance {
        return this._instance;
    }

    get configuration(): Configuration {
        return this._configuration;
    }

    get comments(): string {
        return this._comments;
    }

    set comments(value: string) {
        this._comments = value;
    }

    constructor(public dialogRef: MatDialogRef<RequestExtensionDialog>,
                private accountService: AccountService,
                @Inject(MAT_DIALOG_DATA) public data: { instance: Instance, configuration: Configuration }) {
        this._instance = data.instance;
        this._configuration = data.configuration;
    }

    public ngOnInit(): void {
        this.bindDialogHandlers();
    }

    private bindDialogHandlers(): void {
        this.dialogRef.backdropClick().subscribe(() => {
            this.handleClose();
        });

        this.dialogRef.keydownEvents().subscribe((event) => {
            if (event.key === 'Escape') {
                this.handleClose();
            }
        });
    }

    public submit(): void {
        this.accountService.requestInstanceLifetimeExtension(this.instance, this._comments)
            .subscribe((instance) => {
                this.dialogRef.close(instance);
            });
    }

    public handleClose(): void {
        this.dialogRef.close();
    }


}
