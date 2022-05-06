import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-admin-image-delete',
    styleUrls: ['./image-delete.component.scss'],
    templateUrl: './image-delete.component.html',
})
export class ImageDeleteComponent {


    private _dialogRef: MatDialogRef<ImageDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<ImageDeleteComponent>) {
        this._dialogRef = dialogRef;
        this._dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this._dialogRef.close();
            }
        });
        this._dialogRef.backdropClick().subscribe(this._dialogRef.close);
    }


    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._dialogRef.close(true);
    }

}
