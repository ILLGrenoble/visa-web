import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-security-group-delete',
    templateUrl: './security-group-delete.component.html',
})
export class SecurityGroupDeleteComponent {

    private _dialogRef: MatDialogRef<SecurityGroupDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<SecurityGroupDeleteComponent>, @Inject(MAT_DIALOG_DATA) readonly _data) {
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
