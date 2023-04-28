import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AccountService, Instance} from '@core';
import {InstanceForm} from '@shared';
import {filter} from 'rxjs/operators';
import {AbstractControl} from "@angular/forms";

@Component({
    selector: 'visa-instance-list-details-dialog',
    templateUrl: 'details.component.html',
    styleUrls: ['./details.component.scss']
})
export class DetailsDialog implements OnInit {

    public _instance: Instance;

    private _form: InstanceForm = new InstanceForm();

    private _screenResolution: { label: string, width: number, height: number };

    private _name: string;

    private _comments: string;

    private _keyboardLayout: string;

    private _unrestrictedAccess: boolean;

    get form(): InstanceForm {
        return this._form;
    }

    set form(value: InstanceForm) {
        this._form = value;
    }

    get instance(): Instance {
        return this._instance;
    }

    set instance(value: Instance) {
        this._instance = value;
    }

    get name(): AbstractControl {
        return this._form.get('name');
    }

    get comments(): AbstractControl {
        return this._form.get('comments');
    }

    get unrestrictedAccess(): boolean {
        return this._unrestrictedAccess;
    }

    set unrestrictedAccess(value: boolean) {
        this._unrestrictedAccess = value;
    }

    constructor(
        public dialogRef: MatDialogRef<DetailsDialog>,
        private accountService: AccountService,
        @Inject(MAT_DIALOG_DATA) public data: { instance: Instance }) {
        this.instance = data.instance;
        const instance = data.instance;
        this._name = instance.name;
        this._comments = instance.comments;
        this._screenResolution = {
            label: `${instance.screenWidth} x ${instance.screenHeight}`,
            width: instance.screenWidth,
            height: instance.screenHeight,
        };
        this._keyboardLayout = instance.keyboardLayout;
        this.unrestrictedAccess = instance.unrestrictedAccess;

    }

    public isValidData(): boolean {
        return this.form.valid;
    }

    public canSubmit(): boolean {
        return this.isValidData();
    }

    public submit(): void {
        const data = this.form.value;
        this.accountService.updateInstance(this.instance, {
            name: data.name,
            comments: data.comments,
            screenWidth: data.screenResolution.width,
            screenHeight: data.screenResolution.height,
            keyboardLayout: data.keyboardLayout,
            unrestrictedAccess: data.unrestrictedAccess,
        }).subscribe((instance) => this.dialogRef.close(instance));
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public ngOnInit(): void {
        this.form.removeControl('acceptedTerms');
        this.form.get('name').setValue(this._name);
        this.form.get('comments').setValue(this._comments);
        this.form.get('screenResolution').setValue(this._screenResolution);
        this.form.get('keyboardLayout').setValue(this._keyboardLayout);
        this.form.get('unrestrictedAccess').setValue(this.unrestrictedAccess);
        // Disable the form if the user is not the owner
        if (this.instance.membership.role !== 'OWNER') {
            this.form.disable();
        }

        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this.dialogRef.close());
        this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
    }

}
