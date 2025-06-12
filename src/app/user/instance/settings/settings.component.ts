import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BehaviorSubject} from 'rxjs';
import {filter} from "rxjs/operators";
import {VirtualDesktopManager} from "@vdi";
import {event} from "@cds/core/internal";

@Component({
    selector: 'visa-instance-settings-dialog',
    styleUrls: ['./settings.component.scss'],
    templateUrl: './settings.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent {

    private _timeElapsed$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _totalDataReceived$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _dataReceivedRate$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _manager: VirtualDesktopManager;
    private _isAdmin: boolean;

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

    get dataReceivedRate$(): BehaviorSubject<number> {
        return this._dataReceivedRate$;
    }

    set dataReceivedRate$(value: BehaviorSubject<number>) {
        this._dataReceivedRate$ = value;
    }

    get manager(): VirtualDesktopManager {
        return this._manager;
    }

    set manager(value: VirtualDesktopManager) {
        this._manager = value;
    }

    get isAdmin(): boolean {
        return this._isAdmin;
    }

    set isAdmin(value: boolean) {
        this._isAdmin = value;
    }

    constructor(private dialogRef: MatDialogRef<SettingsComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any) {
        this.timeElapsed$ = data.timeElapsed$;
        this.totalDataReceived$ = data.totalDataReceived$;
        this.dataReceivedRate$ = data.dataReceivedRate$;
        this.manager = data.manager;
        this.isAdmin = data.isAdmin;

        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this.dialogRef.close());
    }


    public handleClose(): void {
        this.dialogRef.close();
    }

}
