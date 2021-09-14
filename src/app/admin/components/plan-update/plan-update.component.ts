import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour, Image, PlanInput} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-plan-update',
    styleUrls: ['./plan-update.component.scss'],
    templateUrl: './plan-update.component.html',
})
export class PlanUpdateComponent implements OnInit {

    private _onUpdate$: EventEmitter<any> = new EventEmitter();

    private _planInput: PlanInput;
    private _images: Image[];
    private _flavours: Flavour[];

    get onUpdate$(): EventEmitter<any> {
        return this._onUpdate$;
    }

    get planInput(): PlanInput {
        return this._planInput;
    }

    get images(): Image[] {
        return this._images;
    }

    get flavours(): Flavour[] {
        return this._flavours;
    }

    constructor(private _dialogRef: MatDialogRef<PlanUpdateComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
    }

    public ngOnInit(): void {
        const plan = this._data.plan;
        this._planInput = {
            imageId: plan.image.id,
            flavourId: plan.flavour.id,
            preset: plan.preset
        };
        this._images = this._data.images;
        this._flavours = this._data.flavours;
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onUpdate(): void {
        this._onUpdate$.emit(this._planInput);
    }

}
