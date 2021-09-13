import {Component, EventEmitter, Inject,  OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Flavour} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-flavour-delete',
    styleUrls: ['./flavour-delete.component.scss'],
    templateUrl: './flavour-delete.component.html',
})
export class FlavourDeleteComponent implements OnInit {

    private _onDelete$: EventEmitter<any> = new EventEmitter();
    private _flavour: Flavour;

    get flavour(): Flavour {
        return this._flavour;
    }


    get onDelete$(): EventEmitter<any> {
        return this._onDelete$;
    }

    constructor(private _dialogRef: MatDialogRef<FlavourDeleteComponent>, @Inject(MAT_DIALOG_DATA) private _data) {
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
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._onDelete$.emit();
        this._dialogRef.close();
    }

}
