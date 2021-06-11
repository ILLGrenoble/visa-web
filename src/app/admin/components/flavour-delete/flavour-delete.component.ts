import {Component, EventEmitter, Inject,  OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour} from '@core';

@Component({
    selector: 'visa-admin-flavour-delete',
    styleUrls: ['./flavour-delete.component.scss'],
    templateUrl: './flavour-delete.component.html',
})
export class FlavourDeleteComponent implements OnInit {

    public delete: EventEmitter<any> = new EventEmitter();

    public flavour: Flavour;

    constructor(public dialogRef: MatDialogRef<FlavourDeleteComponent>, @Inject(MAT_DIALOG_DATA) private data) {
    }

    public ngOnInit(): void {
        this.flavour = this.data.flavour;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public onDelete(): void {
        this.delete.emit();
        this.dialogRef.close();
    }

}
