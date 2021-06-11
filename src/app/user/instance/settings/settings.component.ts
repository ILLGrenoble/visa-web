import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'visa-instance-settings-dialog',
    styleUrls: ['./settings.component.scss'],
    templateUrl: './settings.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent {

    private _timeElapsed$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _totalDataReceived$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

    get timeElapsed$(): BehaviorSubject<number> {
        return this._timeElapsed$;
    }

    set timeElapsed$(value: BehaviorSubject<number>) {
        this._timeElapsed$ = value;
    }

    get totalDataReceived$(): BehaviorSubject<number> {
        return this._totalDataReceived$;
    }

    set totalDataReceived$(value: BehaviorSubject<number>) {
        this._totalDataReceived$ = value;
    }

    constructor(private dialogRef: MatDialogRef<SettingsComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any) {
        this.timeElapsed$ = data.timeElapsed$;
        this.totalDataReceived$ = data.totalDataReceived$;
    }


    public handleClose($event): void {
        this.dialogRef.close();
    }

}
