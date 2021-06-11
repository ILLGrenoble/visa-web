import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'visa-instance-list-experiments-dialog',
    templateUrl: 'experiments.component.html',
})
// tslint:disable-next-line:component-class-suffix
export class ExperimentsDialog {

    public experiments: [];

    constructor(
        public dialogRef: MatDialogRef<ExperimentsDialog>,
        @Inject(MAT_DIALOG_DATA) public data: { experiments: [] }) {
        this.experiments = data.experiments;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

}
