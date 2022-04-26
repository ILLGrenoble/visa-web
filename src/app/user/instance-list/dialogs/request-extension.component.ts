import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AccountService, Configuration, Instance} from '@core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'visa-instance-request-extension-dialog',
    templateUrl: 'request-extension.component.html',
})
// tslint:disable-next-line:component-class-suffix
export class RequestExtensionDialog implements OnInit {

    public _instance: Instance;

    private readonly _configuration: Configuration;

    private _form: FormGroup;

    get instance(): Instance {
        return this._instance;
    }

    get configuration(): Configuration {
        return this._configuration;
    }

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    constructor(public dialogRef: MatDialogRef<RequestExtensionDialog>,
                private accountService: AccountService,
                @Inject(MAT_DIALOG_DATA) public data: { instance: Instance, configuration: Configuration }) {
        this._instance = data.instance;
        this._configuration = data.configuration;
    }

    public ngOnInit(): void {
        this.bindDialogHandlers();
        this.createForm();
        // Disable the form if the user is not the owner
        if (this.instance.membership.role !== 'OWNER') {
            this.form.disable();
        }
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

    private createForm(): void {
        this.form = new FormGroup({
            comments: new FormControl('', Validators.compose([Validators.maxLength(4000), Validators.required])),
        });
    }

    public isValidData(): boolean {
        return this._form.valid;
    }

    public canSubmit(): boolean {
        return this.isValidData();
    }

    public submit(): void {
        const {comments} = this._form.value;
        this.accountService.requestInstanceLifetimeExtension(this.instance, comments)
            .subscribe((data) => {
                this.dialogRef.close(data);
            });
    }

    public handleClose(): void {
        this.dialogRef.close();
    }
}
