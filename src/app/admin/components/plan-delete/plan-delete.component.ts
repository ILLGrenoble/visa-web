import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-admin-plan-delete',
    templateUrl: './plan-delete.component.html',
})
export class PlanDeleteComponent {


    private _dialogRef: MatDialogRef<PlanDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<PlanDeleteComponent>) {
        this._dialogRef = dialogRef;
        this._dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this._dialogRef.close();
            }
        });
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());
    }


    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._dialogRef.close(true);
    }

}
