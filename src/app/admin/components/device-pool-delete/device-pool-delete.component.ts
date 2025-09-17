import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-device-pool-delete',
    templateUrl: './device-pool-delete.component.html',
})
export class DevicePoolDeleteComponent {

    constructor(private _dialogRef: MatDialogRef<DevicePoolDeleteComponent>, @Inject(MAT_DIALOG_DATA) private _data) {
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
