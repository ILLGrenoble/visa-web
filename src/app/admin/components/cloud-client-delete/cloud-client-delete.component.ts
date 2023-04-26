import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-cloud-client-delete',
    templateUrl: './cloud-client-delete.component.html',
})
export class CloudClientDeleteComponent {


    private _dialogRef: MatDialogRef<CloudClientDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<CloudClientDeleteComponent>) {
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
