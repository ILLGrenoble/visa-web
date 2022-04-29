import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {NotificationPayload} from '../models';
import {ObjectMapperService} from './object-mapper.service';
import {NotificationsActions} from '../actions';
import {Store} from '@ngrx/store';
import {ApplicationState} from '../state';

@Injectable()
export class NotificationService {

    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService,
                private store: Store<ApplicationState>) {
    }

    public getAll(): Promise<NotificationPayload> {
        return new Promise<NotificationPayload>((resolve, reject) => {
            const notificationUrl = `${environment.paths.api}/notifications`;
            this.http.get<any>(notificationUrl)
                .toPromise()
                .then((response) => {
                    const notificationPayload = this.objectMapper.deserialize(response.data, NotificationPayload);

                    const adminNotifications = notificationPayload.adminNotifications;
                    this.store.dispatch(NotificationsActions.loadNotificationsSuccess({adminNotifications}));

                    resolve(notificationPayload);
                })
                .catch((error) => {
                    console.error(`error loading notifications: ${JSON.stringify(error)}`);
                    reject(error);
                });
        });
    }

}
