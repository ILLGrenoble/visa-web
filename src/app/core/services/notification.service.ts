import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {NotificationPayload} from '../models';
import {ObjectMapperService} from './object-mapper.service';
import {NotificationsActions} from '../actions';
import {Store} from '@ngrx/store';
import {ApplicationState} from '../state';
import {Observable, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {Response} from "./visa-response";

@Injectable()
export class NotificationService {

    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService,
                private store: Store<ApplicationState>) {
    }

    public getAll(): Observable<NotificationPayload> {
        const notificationUrl = `${environment.paths.api}/notifications`;
        return this.http.get<Response<NotificationPayload>>(notificationUrl).pipe(
            map((response) => {
                const notificationPayload = this.objectMapper.deserialize(response.data, NotificationPayload);

                const adminNotifications = notificationPayload.adminNotifications;
                this.store.dispatch(NotificationsActions.loadNotificationsSuccess({adminNotifications}));

                return notificationPayload;
            }),
            catchError((error) => {
                console.error(`error loading notifications: ${JSON.stringify(error)}`);
                return throwError(error);
            })
        );
    }

    public getAllAcknowledged(): Observable<number[]> {
        const notificationUrl = `${environment.paths.api}/notifications/acknowledged`;

        return this.http.get<Response<number[]>>(notificationUrl).pipe(
            map((response) => response.data));
    }

    public acknowledgeNotification(notificationId: number): Observable<boolean> {
        const notificationUrl = `${environment.paths.api}/notifications/acknowledged`;

        return this.http.post<Response<number>>(notificationUrl, notificationId).pipe(
            map(() => true));
    }
}
