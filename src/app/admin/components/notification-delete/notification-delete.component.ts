import {Component, EventEmitter, Inject,  OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Image, SystemNotification} from '../../../core/graphql';
import {filter} from 'rxjs/operators';

interface SystemNotificationHolder {
    id: number,
    message: string;
    level: string;
    activatedAt: string;
    originalText: string;
}

@Component({
    selector: 'visa-admin-notification-delete',
    styleUrls: ['./notification-delete.component.scss'],
    templateUrl: './notification-delete.component.html',
})
export class NotificationDeleteComponent implements OnInit {

    private _onDelete$: EventEmitter<any> = new EventEmitter();

    get onDelete$(): EventEmitter<any> {
        return this._onDelete$;
    }

    constructor(private _dialogRef: MatDialogRef<NotificationDeleteComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(_ => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());
    }

    public ngOnInit(): void {
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public onDelete(): void {
        this._onDelete$.emit();
        this._dialogRef.close();
    }

}
