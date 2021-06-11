import {Component, EventEmitter, Inject,  OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Image} from '@core';

@Component({
    selector: 'visa-admin-image-delete',
    styleUrls: ['./image-delete.component.scss'],
    templateUrl: './image-delete.component.html',
})
export class ImageDeleteComponent implements OnInit {

    public delete: EventEmitter<any> = new EventEmitter();

    public image: Image;

    constructor(public dialogRef: MatDialogRef<ImageDeleteComponent>, @Inject(MAT_DIALOG_DATA) private data) {
    }

    public ngOnInit(): void {
        this.image = this.data.image;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public onDelete(): void {
        this.delete.emit();
        this.dialogRef.close();
    }

}
