import {Component, EventEmitter, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudFlavour, Flavour, FlavourLimit, Instrument, FlavourInput} from '../../../core/graphql/types';
import {Apollo} from 'apollo-angular';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-flavour-update',
    styleUrls: ['./flavour-update.component.scss'],
    templateUrl: './flavour-update.component.html',
})
export class FlavourUpdateComponent implements OnInit {

    public update: EventEmitter<any> = new EventEmitter();
    public flavour: Flavour;
    public cloudFlavours: CloudFlavour[];
    public flavourLimits: FlavourLimit[];
    public memory: number;
    public cpu: number;

    public instruments: Instrument[];
    public selectedInstruments: Instrument[] = [];

    constructor(public dialogRef: MatDialogRef<FlavourUpdateComponent>,
                @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.flavour = this.data.flavour;
        this.cloudFlavours = this.data.cloudFlavours;
        this.flavourLimits = this.data.flavourLimits;
        this.instruments = this.data.instruments;

        const flavourInstrumentIds = this.flavourLimits
            .filter(limit => limit.flavour.id === this.flavour.id)
            .filter(limit => limit.objectType === 'INSTRUMENT')
            .map(limit => limit.objectId);

        this.selectedInstruments = this.instruments
            .filter(instrument => (flavourInstrumentIds.includes(instrument.id)));

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
        const input: FlavourInput = {
            name: this.flavour.name,
            computeId: this.flavour.computeId,
            cpu: this.flavour.cpu,
            memory: this.flavour.memory,
            instrumentIds: this.selectedInstruments ? this.selectedInstruments.map(instrument => instrument.id) : []
        };
        this.update.emit({flavourInput: input});
    }
}
