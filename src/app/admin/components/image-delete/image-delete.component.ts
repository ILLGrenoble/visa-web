import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-image-delete',
    templateUrl: './image-delete.component.html',
})
export class ImageDeleteComponent {


    private _dialogRef: MatDialogRef<ImageDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<ImageDeleteComponent>) {
        this._dialogRef = dialogRef;
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(_ => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());
    }


    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._dialogRef.close(true);
    }

}
