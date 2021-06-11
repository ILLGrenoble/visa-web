import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-instance-url-dialog',
    templateUrl: './url.component.html',
})
export class UrlComponent {
    public url = '';

    constructor(private dialogRef: MatDialogRef<UrlComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any) {
        this.url = data.url;
    }

    public onConfirm(): void {
        this.dialogRef.close(true);
    }

    public onNoClick(): void {
        this.dialogRef.close(false);
    }


}
