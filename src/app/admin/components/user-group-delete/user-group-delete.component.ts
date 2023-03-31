import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Subject} from "rxjs";

@Component({
    selector: 'visa-admin-user-group-delete',
    templateUrl: './user-group-delete.component.html',
})
export class UserGroupDeleteComponent implements OnInit {

    private _dialogRef: MatDialogRef<UserGroupDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<UserGroupDeleteComponent>, @Inject(MAT_DIALOG_DATA) readonly _data) {
        this._dialogRef = dialogRef;
        this._dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this._dialogRef.close();
            }
        });
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());
    }

    public ngOnInit(): void {
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._dialogRef.close(true);
    }

}
