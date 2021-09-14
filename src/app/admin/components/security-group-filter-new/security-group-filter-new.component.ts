import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup} from "@angular/forms";


@Component({
    selector: 'visa-admin-security-group-filter-new',
    templateUrl: './security-group-filter-new.component.html'
})
export class SecurityGroupFilterNewComponent implements OnInit, OnDestroy {

    private _dialogRef: MatDialogRef<SecurityGroupFilterNewComponent>;
    private _form: FormGroup;

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    objectIdentifiers = [
        {
            id: 'd11',
            name: 'D11'
        }
    ];

    securityGroups = [
        {id: 1, name: 'visa-instances-test-123'}
    ];

    roles = [
        {id: 1, name: 'ROLE_ADMIN'}
    ];

    private createForm(): FormGroup {
        return new FormGroup({
            securityGroup: new FormControl(this.securityGroups[0]),
            role: new FormControl(this.roles[0])
        });
    }


    constructor(dialogRef: MatDialogRef<SecurityGroupFilterNewComponent>, @Inject(MAT_DIALOG_DATA) public data) {
        this._dialogRef = dialogRef;
        this._form = this.createForm();
    }

    submit(): void {

    }

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
