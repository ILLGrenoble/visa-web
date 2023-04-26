import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-user-group-delete',
    templateUrl: './user-group-delete.component.html',
})
export class UserGroupDeleteComponent {

    private _dialogRef: MatDialogRef<UserGroupDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<UserGroupDeleteComponent>, @Inject(MAT_DIALOG_DATA) readonly _data) {
        this._dialogRef = dialogRef;
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._dialogRef.close(true);
    }

}
