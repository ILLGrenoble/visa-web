import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudFlavour, FlavourInput, Instrument} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-flavour-new',
    styleUrls: ['./flavour-new.component.scss'],
    templateUrl: './flavour-new.component.html',
})
export class FlavourNewComponent implements OnInit {

    private _onCreate$: EventEmitter<any> = new EventEmitter();

    private _cloudFlavours: CloudFlavour[];
    private _selectedCloudFlavour: CloudFlavour;
    private _name: string;
    private _credits = 1;

    private _instruments: Instrument[];
    private _selectedInstruments: Instrument[] = [];

    get onCreate$(): EventEmitter<any> {
        return this._onCreate$;
    }

    get cloudFlavours(): CloudFlavour[] {
        return this._cloudFlavours;
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

    get credits(): number {
        return this._credits;
    }

    set credits(value: number) {
        this._credits = value;
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

    constructor(private _dialogRef: MatDialogRef<FlavourNewComponent>,
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
        this._cloudFlavours = this._data.cloudFlavours;
        this._instruments = this._data.instruments;
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onCreate(): void {
        const input: FlavourInput = {
            name: this._name,
            computeId: this._selectedCloudFlavour.id,
            memory: this._selectedCloudFlavour.ram,
            cpu: this._selectedCloudFlavour.cpus,
            credits: this._credits,
            instrumentIds: this.selectedInstruments ? this.selectedInstruments.map(instrument => instrument.id) : []
        };
        this._onCreate$.emit(input);
    }

}
