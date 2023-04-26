import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AccountService, Configuration, Instance} from '@core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-instance-request-extension-dialog',
    templateUrl: 'request-extension.component.html',
})
export class RequestExtensionDialog implements OnInit {

    public _instance: Instance;

    private readonly _configuration: Configuration;

    private _form: UntypedFormGroup;

    get instance(): Instance {
        return this._instance;
    }

    get configuration(): Configuration {
        return this._configuration;
    }

    get form(): UntypedFormGroup {
        return this._form;
    }

    set form(value: UntypedFormGroup) {
        this._form = value;
    }

    get comments(): AbstractControl {
        return this._form.get('comments');
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
        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this.dialogRef.close());
        this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
    }

    private createForm(): void {
        this.form = new UntypedFormGroup({
            comments: new UntypedFormControl('', Validators.compose([Validators.maxLength(4000), Validators.required])),
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
