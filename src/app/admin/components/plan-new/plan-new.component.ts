import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour, Image, PlanInput} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-plan-new',
    styleUrls: ['./plan-new.component.scss'],
    templateUrl: './plan-new.component.html',
})
export class PlanNewComponent implements OnInit {

    private _onCreate$: EventEmitter<any> = new EventEmitter();

    private _flavours: Flavour[];
    private _images: Image[];

    private _selectedFlavourId: number;
    private _selectedImageId: number;
    private _preset = false;


    get onCreate$(): EventEmitter<any> {
        return this._onCreate$;
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    get images(): Image[] {
        return this._images;
    }


    get selectedFlavourId(): number {
        return this._selectedFlavourId;
    }

    set selectedFlavourId(value: number) {
        this._selectedFlavourId = value;
    }

    get selectedImageId(): number {
        return this._selectedImageId;
    }

    set selectedImageId(value: number) {
        this._selectedImageId = value;
    }

    get preset(): boolean {
        return this._preset;
    }

    set preset(value: boolean) {
        this._preset = value;
    }

    constructor(private _dialogRef: MatDialogRef<PlanNewComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
    }

    public ngOnInit(): void {
        this._images = this._data.images;
        this._flavours = this._data.flavours;
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onCreate(): void {
        const input: PlanInput = {
            imageId: this._selectedImageId,
            flavourId: this._selectedFlavourId,
            preset: this._preset
        };
        this._onCreate$.emit(input);
    }

}
