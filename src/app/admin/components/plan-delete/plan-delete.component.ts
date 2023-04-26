import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-plan-delete',
    templateUrl: './plan-delete.component.html',
})
export class PlanDeleteComponent {


    private _dialogRef: MatDialogRef<PlanDeleteComponent>;

    constructor(readonly dialogRef: MatDialogRef<PlanDeleteComponent>) {
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
