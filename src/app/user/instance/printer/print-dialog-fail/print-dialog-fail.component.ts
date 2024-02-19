import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-instance-print-dialog-fail-dialog',
    templateUrl: './print-dialog-fail.component.html',
    styleUrls: ['./print-dialog-fail.component.scss'],
})
export class PrintDialogFailComponent {

    jobId: number;

    constructor(private dialogRef: MatDialogRef<PrintDialogFailComponent>,
                @Inject(MAT_DIALOG_DATA) private data: { jobId: number }) {
        this.jobId = data.jobId;
    }

    public onClose(): void {
        this.dialogRef.close(true);
    }
}
