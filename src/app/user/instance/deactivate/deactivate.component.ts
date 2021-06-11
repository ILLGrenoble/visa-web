import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-instance-deactivate-dialog',
    template: `
        <h1 mat-dialog-title>Exiting instance view</h1>
        <div mat-dialog-content>
            Are you sure you wish to navigate away from this instance? You will lose the current connection.
            <div class="modal-footer">
                <button type="button" (click)="onNoClick()" class="btn btn-outline">Cancel</button>
                <button type="button"
                    class="btn btn-primary"
                    [mat-dialog-close]="true">
                    Yes, I'm sure
                </button>
            </div>
        </div>
    `,
})
export class DeactivateComponent {

    constructor(private dialogRef: MatDialogRef<DeactivateComponent>) {

    }

    public onNoClick(): void {
        this.dialogRef.close(false);
    }

}
