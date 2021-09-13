import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour, Image} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-plan-new',
    styleUrls: ['./plan-new.component.scss'],
    templateUrl: './plan-new.component.html',
})
export class PlanNewComponent implements OnInit {

    public create: EventEmitter<any> = new EventEmitter();

    public flavours: Flavour[];
    public images: Image[];

    public selectedFlavour: number;
    public selectedImage: number;
    public preset = false;

    constructor(public dialogRef: MatDialogRef<PlanNewComponent>, @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.images = this.data.images;
        this.flavours = this.data.flavours;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        const input: any = {};
        input.imageId = this.selectedImage;
        input.flavourId = this.selectedFlavour;
        input.preset = this.preset;
        this.create.emit(input);
    }

}
