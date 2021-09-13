import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour, Image, Plan} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-plan-update',
    styleUrls: ['./plan-update.component.scss'],
    templateUrl: './plan-update.component.html',
})
export class PlanUpdateComponent implements OnInit {

    public update: EventEmitter<any> = new EventEmitter();

    public plan: Plan;
    public images: Image[];
    public flavours: Flavour[];

    constructor(public dialogRef: MatDialogRef<PlanUpdateComponent>, @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.plan = this.data.plan;
        this.images = this.data.images;
        this.flavours = this.data.flavours;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        const input: any = {};
        input.imageId = this.plan.image.id;
        input.flavourId = this.plan.flavour.id;
        input.preset = this.plan.preset;
        this.update.emit(input);
    }

}
