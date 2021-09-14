import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudFlavour, Flavour, Instrument, FlavourInput} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-flavour-update',
    styleUrls: ['./flavour-update.component.scss'],
    templateUrl: './flavour-update.component.html',
})
export class FlavourUpdateComponent implements OnInit {

    private _onUpdate$: EventEmitter<any> = new EventEmitter();
    private _selectedCloudFlavour: CloudFlavour;
    private _name: string;
    private _flavour: Flavour;
    private _cloudFlavours: CloudFlavour[];

    private _instruments: Instrument[];
    private _selectedInstruments: Instrument[] = [];

    get onUpdate$(): EventEmitter<any> {
        return this._onUpdate$;
    }

    get selectedCloudFlavourId(): string {
        return this._selectedCloudFlavour ? this._selectedCloudFlavour.id : null;
    }

    set selectedCloudFlavourId(value: string) {
        this._selectedCloudFlavour = this._cloudFlavours.find(cloudFlavour => cloudFlavour.id === value);
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get flavour(): Flavour {
        return this._flavour;
    }

    get cloudFlavours(): CloudFlavour[] {
        return this._cloudFlavours;
    }

    get instruments(): Instrument[] {
        return this._instruments;
    }

    get selectedInstruments(): Instrument[] {
        return this._selectedInstruments;
    }

    set selectedInstruments(value: Instrument[]) {
        this._selectedInstruments = value;
    }

    get memory(): number {
        return this._selectedCloudFlavour ? this._selectedCloudFlavour.ram / 1024 : 0;
    }

    get cpu(): number {
        return this._selectedCloudFlavour ? this._selectedCloudFlavour.cpus : 0;
    }

    constructor(private _dialogRef: MatDialogRef<FlavourUpdateComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
        this._dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this._dialogRef.close();
            }
        });

        this._dialogRef.backdropClick().subscribe(event => {
            this._dialogRef.close();
        });
    }

    public ngOnInit(): void {
        this._flavour = this._data.flavour;
        this._name = this._flavour.name;
        this._cloudFlavours = this._data.cloudFlavours;
        this._instruments = this._data.instruments;
        this._selectedCloudFlavour = this._cloudFlavours.find(cloudFlavour => cloudFlavour.id === this._flavour.computeId);

        const flavourInstrumentIds = this._data.flavourLimits
            .filter(limit => limit.flavour.id === this.flavour.id)
            .filter(limit => limit.objectType === 'INSTRUMENT')
            .map(limit => limit.objectId);

        this.selectedInstruments = this.instruments
            .filter(instrument => (flavourInstrumentIds.includes(instrument.id)));
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onUpdate(): void {
        const input: FlavourInput = {
            name: this._name,
            computeId: this._selectedCloudFlavour.id,
            memory: this._selectedCloudFlavour.ram,
            cpu: this._selectedCloudFlavour.cpus,
            instrumentIds: this.selectedInstruments ? this.selectedInstruments.map(instrument => instrument.id) : []
        };
        this._onUpdate$.emit({flavourInput: input});
    }
}
