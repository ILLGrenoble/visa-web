import {Component, EventEmitter, Inject,  OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Image} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-image-delete',
    styleUrls: ['./image-delete.component.scss'],
    templateUrl: './image-delete.component.html',
})
export class ImageDeleteComponent implements OnInit {

    private _onDelete$: EventEmitter<any> = new EventEmitter();

    private _image: Image;

    get onDelete$(): EventEmitter<any> {
        return this._onDelete$;
    }

    get image(): Image {
        return this._image;
    }

    constructor(private _dialogRef: MatDialogRef<ImageDeleteComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
    }

    public ngOnInit(): void {
        this._image = this._data.image;
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._onDelete$.emit();
        this._dialogRef.close();
    }

}
