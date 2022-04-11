import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {User, UserInput} from '../../../core/graphql';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-user-edit',
    templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit {

    private _onSubmit$: Subject<UserInput> = new Subject<UserInput>();

    private _form: FormGroup;

    get user(): User {
        return this._user;
    }

    public get form(): FormGroup {
        return this._form;
    }

    public set form(value: FormGroup) {
        this._form = value;
    }

    get onSubmit$(): Subject<UserInput> {
        return this._onSubmit$;
    }

    constructor(private _dialogRef: MatDialogRef<UserEditComponent>,
                @Inject(MAT_DIALOG_DATA) private _user) {

    }

    private _createForm(): FormGroup {
        const {instanceQuota, roles} = this._user;
        const admin = roles.find(role => role.name === 'ADMIN') != null;
        return new FormGroup({
            instanceQuota: new FormControl(instanceQuota),
            admin: new FormControl(admin),
        });
    }

    public ngOnInit(): void {
        this._form = this._createForm();

    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const input = this._form.value as UserInput;
        this._onSubmit$.next(input);
        this._dialogRef.close();
    }

}
