import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {pipe} from "rxjs";
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-instance-list-experiments-dialog',
    templateUrl: 'experiments.component.html',
})
// tslint:disable-next-line:component-class-suffix
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
        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(_ => this.dialogRef.close());
        this.dialogRef.backdropClick().subscribe(_ => this.dialogRef.close());
    }
}
