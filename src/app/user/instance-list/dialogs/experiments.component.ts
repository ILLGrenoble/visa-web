import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-instance-list-experiments-dialog',
    templateUrl: 'experiments.component.html',
})
export class ExperimentsDialog implements OnInit {

    public experiments: [];

    constructor(
        public dialogRef: MatDialogRef<ExperimentsDialog>,
        @Inject(MAT_DIALOG_DATA) public data: { experiments: [] }) {
        this.experiments = data.experiments;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public ngOnInit(): void {
        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this.dialogRef.close());
        this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
    }
}
