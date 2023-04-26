import {Component, EventEmitter, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-notification-delete',
    styleUrls: ['./notification-delete.component.scss'],
    templateUrl: './notification-delete.component.html',
})
export class NotificationDeleteComponent {

    private _onDelete$: EventEmitter<any> = new EventEmitter();

    get onDelete$(): EventEmitter<any> {
        return this._onDelete$;
    }

    constructor(private _dialogRef: MatDialogRef<NotificationDeleteComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._onDelete$.emit();
        this._dialogRef.close();
    }

}
