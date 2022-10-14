import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AccountService, Instance} from '@core';
import {InstanceForm} from '@shared';

@Component({
    selector: 'visa-instance-list-details-dialog',
    templateUrl: 'details.component.html',
    styleUrls: ['./details.component.scss']
})
// tslint:disable-next-line:component-class-suffix
export class DetailsDialog implements OnInit {

    public _instance: Instance;

    private _form: InstanceForm = new InstanceForm();

    private _canSubmit = true;

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

    get screenResolution(): { label: string, width: number, height: number } {
        return this._screenResolution;
    }

    set screenResolution(value: { label: string, width: number, height: number }) {
        this._screenResolution = value;
    }


    get keyboardLayout(): string {
        return this._keyboardLayout;
    }

    set keyboardLayout(value: string) {
        this._keyboardLayout = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get comments(): string {
        return this._comments;
    }

    set comments(value: string) {
        this._comments = value;
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
        this.screenResolution = {
            label: `${instance.screenWidth} x ${instance.screenHeight}`,
            width: instance.screenWidth,
            height: instance.screenHeight,
        };
        this.keyboardLayout = instance.keyboardLayout;
        this.name = instance.name;
        this.comments = instance.comments;
        this.unrestrictedAccess = instance.unrestrictedAccess;
    }

    public isValidData(): boolean {
        return this.form.valid;
    }

    public canSubmit(): boolean {
        return this.isValidData() && this._canSubmit;
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
        this.form.get('name').setValue(this.name);
        this.form.get('comments').setValue(this.comments);
        this.form.get('screenResolution').setValue(this.screenResolution);
        this.form.get('keyboardLayout').setValue(this.keyboardLayout);
        this.form.get('unrestrictedAccess').setValue(this.unrestrictedAccess);
        // Disable the form if the user is not the owner
        if (this.instance.membership.role !== 'OWNER') {
            this.form.disable();
        }
    }

}
