import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-account',
    templateUrl: './account.component.html',
})
export class AccountComponent {

    constructor(private dialogRef: MatDialogRef<AccountComponent>) {
    }

    public handleClose(): void {
        this.dialogRef.close();
    }

}
