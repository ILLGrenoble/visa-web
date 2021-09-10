import {Component, EventEmitter, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudFlavour, Flavour, FlavourLimit, Instrument, UpdateFlavourInput} from '../../../core/graphql/types';
import {Apollo} from 'apollo-angular';
import {map, takeUntil} from 'rxjs/operators';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-flavour-update',
    styleUrls: ['./flavour-update.component.scss'],
    templateUrl: './flavour-update.component.html',
})
export class FlavourUpdateComponent implements OnInit, OnDestroy {

    public update: EventEmitter<any> = new EventEmitter();
    public flavour: Flavour;
    public cloudFlavours: CloudFlavour[];
    public flavourLimits: FlavourLimit[];
    public memory: number;
    public cpu: number;

    public instruments: Instrument[];
    public selectedInstruments: Instrument[] = [];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private apollo: Apollo,
                public dialogRef: MatDialogRef<FlavourUpdateComponent>,
                @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.flavour = this.data.flavour;
        this.cloudFlavours = this.data.cloudFlavours;
        this.flavourLimits = this.data.flavourLimits;

        this.memory = this.flavour.memory;
        this.cpu = this.flavour.cpu;

        this.loadInstruments();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
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

    private loadInstruments(): void {
        this.apollo.query<any>({
            query: gql`
                query instruments {
                    instruments {
                        id
                        name
                   }
                }
            `,
        }).pipe(
            map(({data}) => (data.instruments)),
            takeUntil(this._destroy$)
        ).subscribe((instruments) => {
            this.instruments = instruments;

            const flavourInstrumentIds = this.flavourLimits
                .filter(limit => limit.flavour.id === this.flavour.id)
                .filter(limit => limit.objectType === 'INSTRUMENT')
                .map(limit => limit.objectId);

            this.selectedInstruments = this.instruments
                .filter(instrument => (flavourInstrumentIds.includes(instrument.id)));
        });
    }
}
