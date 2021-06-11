import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-instance-access-request-dialog',
    templateUrl: './access-request.component.html',
})
export class AccessRequestComponent {

    public userFullName: string;
    private callback: (response: string) => void;

    constructor(private dialogRef: MatDialogRef<AccessRequestComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any) {
        this.callback = data.callback;
        this.userFullName = data.userFullName;
    }

    public onReject(): void {
        this.callback('NONE');
        this.dialogRef.close();
    }

    public onFullAccess(): void {
        this.callback('SUPPORT');
        this.dialogRef.close();
    }

    public onReadOnlyAccess(): void {
        this.callback('GUEST');
        this.dialogRef.close();
    }

}
