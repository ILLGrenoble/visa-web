import {JsonObject, JsonProperty} from 'json2typescript';
import {SystemNotification} from './system-notification.model';
import {ClientNotification} from './client-notification.model';

@JsonObject('NotificationPayload')
export class NotificationPayload {

    @JsonProperty('systemNotifications', [SystemNotification])
    private _systemNotifications: SystemNotification[] = [];

    @JsonProperty('adminNotifications', [ClientNotification])
    private _adminNotifications: ClientNotification[] = [];


    get systemNotifications(): SystemNotification[] {
        return this._systemNotifications;
    }

    set systemNotifications(value: SystemNotification[]) {
        this._systemNotifications = value;
    }

    get adminNotifications(): ClientNotification[] {
        return this._adminNotifications;
    }

    set adminNotifications(value: ClientNotification[]) {
        this._adminNotifications = value;
    }
}
