import {Component, EventEmitter, Inject,  OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {filter} from 'rxjs/operators';

interface SystemNotificationHolder {
    id: number,
    message: string;
    level: string;
    activatedAt: string;
    originalText: string;
}

@Component({
    selector: 'visa-admin-notification-update',
    styleUrls: ['./notification-update.component.scss'],
    templateUrl: './notification-update.component.html',
})
export class NotificationUpdateComponent implements OnInit {

    private _onUpdate$: EventEmitter<any> = new EventEmitter();

    private _notification: SystemNotificationHolder;

    get onUpdate$(): EventEmitter<any> {
        return this._onUpdate$;
    }

    get notification(): SystemNotificationHolder {
        return this._notification;
    }

    constructor(private _dialogRef: MatDialogRef<NotificationUpdateComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());
    }

    public ngOnInit(): void {
        this._notification = this._data.notification;
    }

    public onCancel(): void {
        this._notification.message = this._notification.originalText;
        this._dialogRef.close();
    }

    public onUpdate(): void {
        this._onUpdate$.emit();
        this._dialogRef.close();
    }

    public canUpdate(): boolean {
        return this._notification.message.length <= 4096;
    }

}
