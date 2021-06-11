import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {SystemNotification} from '../models';
import {ObjectMapperService} from './object-mapper.service';

@Injectable()
export class NotificationService {

    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService) {
    }

    public getAll(): Promise<SystemNotification[]> {
        return new Promise<SystemNotification[]>((resolve, reject) => {
            const notificationUrl = `${environment.paths.api}/notifications`;
            this.http.get<any>(notificationUrl)
                .toPromise()
                .then((response) => {
                    const data = response.data;
                    const notifications = data.map((notification) => this.objectMapper.deserialize(notification, SystemNotification));
                    resolve(notifications);
                })
                .catch((error) => {
                    console.error(`error loading notifications: ${JSON.stringify(error)}`);
                    reject(error);
                });
        });
    }

}
