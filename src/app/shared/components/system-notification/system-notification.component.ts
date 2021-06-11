import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SystemNotification} from '@core';

@Component({
    selector: 'visa-system-notification',
    templateUrl: './system-notification.component.html',
    styleUrls: ['./system-notification.component.scss'],
})
export class SystemNotificationComponent {

    @Output()
    public dismissNotification: EventEmitter<SystemNotification> = new EventEmitter();

    @Input()
    public notification: SystemNotification;


    constructor() {
    }

    onDismiss(): void{
        this.dismissNotification.emit(this.notification);
    }


}
