import {Component, EventEmitter, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudFlavour} from '@core';
import {FlavourInput, Instrument} from '../../../core/graphql/types';

@Component({
    selector: 'visa-admin-flavour-new',
    styleUrls: ['./flavour-new.component.scss'],
    templateUrl: './flavour-new.component.html',
})
export class FlavourNewComponent implements OnInit {

    public create: EventEmitter<any> = new EventEmitter();

    public cloudFlavours: CloudFlavour[];
    public selectedCloudFlavourId: string;
    public nameInput: string;
    public memory: number;
    public cpu: number;

    public instruments: Instrument[];
    public selectedInstruments: Instrument[] = [];

    constructor(public dialogRef: MatDialogRef<FlavourNewComponent>,
                @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.cloudFlavours = this.data.cloudFlavours;
        this.instruments = this.data.instruments;
        this.memory = 0;
        this.cpu = 0;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public onCloudFlavourSelect(): void {
        if (this.selectedCloudFlavourId) {
            this.memory = this.cloudFlavours.find((cloudFlavour) => cloudFlavour.id === this.selectedCloudFlavourId).ram;
            this.cpu = this.cloudFlavours.find((cloudFlavour) => cloudFlavour.id === this.selectedCloudFlavourId).cpus;
        } else {
            this.memory = 0;
            this.cpu = 0;
        }
    }

    public submit(): void {
        const input: FlavourInput = {
            name: this.nameInput,
            computeId: this.selectedCloudFlavourId,
            memory: this.memory,
            cpu: this.cpu,
            instrumentIds: this.selectedInstruments ? this.selectedInstruments.map(instrument => instrument.id) : []
        };
        this.create.emit(input);
    }

}
