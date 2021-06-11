import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudFlavour, Flavour} from '@core';
import {UpdateFlavourInput} from '../../../core/graphql/types';

@Component({
    selector: 'visa-admin-flavour-update',
    styleUrls: ['./flavour-update.component.scss'],
    templateUrl: './flavour-update.component.html',
})
export class FlavourUpdateComponent implements OnInit {

    public update: EventEmitter<any> = new EventEmitter();
    public flavour: Flavour;
    public cloudFlavours: CloudFlavour[];
    public memory: number;
    public cpu: number;

    constructor(public dialogRef: MatDialogRef<FlavourUpdateComponent>, @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.flavour = this.data.flavour;
        this.cloudFlavours = this.data.cloudFlavours;
        this.memory = this.flavour.memory;
        this.cpu = this.flavour.cpu;
    }

    public onCloudFlavourSelect(): void {
        this.memory = this.cloudFlavours.find((cloudFlavour) => cloudFlavour.id === this.flavour.computeId).ram;
        this.cpu = this.cloudFlavours.find((cloudFlavour) => cloudFlavour.id === this.flavour.computeId).cpus;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        const input: UpdateFlavourInput = {
            name: this.flavour.name,
            computeId: this.flavour.computeId,
            cpu: this.flavour.cpu,
            memory: this.flavour.memory,
        };
        this.update.emit(input);
    }

}
