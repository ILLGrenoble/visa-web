import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-instance-print-request-dialog',
    templateUrl: './print-request.component.html',
    styleUrls: ['./print-request.component.scss'],
})
export class PrintRequestComponent {

    constructor(private dialogRef: MatDialogRef<PrintRequestComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any) {
    }

    public onAccept(): void {
        this.dialogRef.close(true);
    }

    public onReject(): void {
        this.dialogRef.close(false);
    }
}
