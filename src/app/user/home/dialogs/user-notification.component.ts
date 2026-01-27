import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SystemNotification} from "@core";
import {Subject} from "rxjs";

@Component({
    selector: 'visa-user-notification-dialog',
    templateUrl: 'user-notification.component.html',
})
export class UserNotificationDialog implements OnInit {

    private _notification: SystemNotification;
    private _modalData$: Subject<{notification: SystemNotification}>;
    private _showModal = false;
    private _onAck$: EventEmitter<SystemNotification> = new EventEmitter<SystemNotification>();

    get showModal(): boolean {
        return this._showModal;
    }

    set showModal(value: boolean) {
        this._showModal = value;
    }

    get notification(): SystemNotification {
        return this._notification;
    }

    @Input()
    set modalData$(value: Subject<{ notification: SystemNotification }>) {
        this._modalData$ = value;
    }

    @Output()
    get onAck(): EventEmitter<SystemNotification> {
        return this._onAck$;
    }

    constructor() {
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
        ).subscribe(data => {
            const {notification} = data;
            this._notification = notification;
            this._showModal = true;
        });
    }

    public submit(): void {
        this._showModal = false;
        this._onAck$.emit(this._notification);
    }
}
