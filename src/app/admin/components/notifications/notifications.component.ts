import {Component, OnInit, ViewChild} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {SystemNotification, SystemNotificationInput} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';
import {MatDialog} from '@angular/material/dialog';
import {NotificationUpdateComponent} from '../notification-update';
import * as moment from 'moment';
import {NotificationDeleteComponent} from '../notification-delete';
import {Title} from '@angular/platform-browser';

interface SystemNotificationHolder {
    id: number,
    message: string;
    level: string;
    activated: boolean;
    activatedAt: string;
    originalText: string;
}

@Component({
    selector: 'visa-admin-notifications',
    styleUrls: ['./notifications.component.scss'],
    templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {

    public notifications: SystemNotificationHolder[];

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private dialog: MatDialog,
                private titleService: Title) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Notifications | Settings | Admin | VISA`);
        this.fetch().then((notifications) => {
                this.notifications = notifications;
            },
        );
    }

    public addRow(): void {
        this.notifications.push({
            id: null,
            message: '',
            level: 'INFO',
            activatedAt: null,
            activated: false,
            originalText: '',
        } as SystemNotificationHolder);
    }

    public toggleActivated(notification: SystemNotificationHolder): void {
        if (notification.activatedAt === null) {
            notification.activatedAt = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');

        } else {
            notification.activatedAt = null;
        }
        this.onDataChange(notification);
    }

    public onTextChange(notification: SystemNotificationHolder): void {
        if (notification.id) {
            const dialogRef = this.dialog.open(NotificationUpdateComponent, {
                width: '400px', data: {notification},
            });
            dialogRef.componentInstance.onUpdate$.subscribe(() => {
                notification.activatedAt = notification.activatedAt != null ? moment(new Date()).format('YYYY-MM-DD hh:mm:ss') : null;
                this.update(notification.id, {level: notification.level, message: notification.message, activatedAt: notification.activatedAt})
                    .then(() => this.onDataChange(notification));
            });

        } else {
            this.onDataChange(notification);
        }
    }

    public onDataChange(notification: SystemNotificationHolder): void {
        if (notification.message === '') {
            return;
        }

        if (notification.id) {
            notification.activatedAt = notification.activatedAt != null ? moment(new Date()).format('YYYY-MM-DD hh:mm:ss') : null;

            this.update(notification.id, {level: notification.level, message: notification.message, activatedAt: notification.activatedAt}).then((data) => {
                notification.message = data.message;
                notification.originalText = data.message;
                notification.activatedAt = data.activatedAt;
                notification.activated = notification.activatedAt != null;
                notification.level = data.level;

                this.showNotification('The system notification has been updated');
            }).catch((error) => {
                console.error(error);
                this.showErrorNotification('Failed to update the system notification');

            });
        } else {
            this.create({level: notification.level, message: notification.message, activatedAt: notification.activatedAt}).then((data) => {
                notification.id = data.id;
                notification.message = data.message;
                notification.originalText = data.message;
                notification.activatedAt = data.activatedAt;
                notification.activated = notification.activatedAt != null;
                notification.level = data.level;

                this.showNotification('The system notification has been created');
            }).catch((error) => {
                console.error(error);
                this.showErrorNotification('Failed to create the system notification');
            });
        }
    }

    public onDelete(notification: SystemNotificationHolder): void {
        if (notification.id != null) {
            const dialogRef = this.dialog.open(NotificationDeleteComponent, {
                width: '400px',
            });
            dialogRef.componentInstance.onDelete$.subscribe(() => {
                this.delete(notification.id).then(() => {
                    this.notifications = this.notifications.filter((aNotification) => aNotification.id !== notification.id);

                    this.showNotification('The system notification has been deleted');
                }).catch((error) => {
                    console.error(error);
                    this.showErrorNotification('Failed to delete the system notification');
                });
            });

        } else {
            this.notifications = this.notifications.filter(aNotification => aNotification !== notification);
        }
    }

    private showNotification(message: string): void {
        this.notifierService.notify('success', message);
    }

    private showErrorNotification(message: string): void {
        this.notifierService.notify('error', message);
    }

    public fetch(): Promise<SystemNotificationHolder[]> {
        return this.apollo.watchQuery<any>({
            query: gql`{
            systemNotifications {
                id
                level
                message
                activatedAt
            }
        }`,
        }).result()
            .then(({data}) => {
                return data.systemNotifications.map(({id, message, level, activatedAt}) => ({
                    id, message, level, activatedAt, originalText: message, activated: activatedAt !== null
                }));
            });
    }

    private create(input: SystemNotificationInput): Promise<SystemNotification> {
        return this.apollo.mutate<any>({
            mutation: gql`
                mutation create($input: SystemNotificationInput!) {
                    createSystemNotification(input: $input) {
                        id
                        level
                        message
                        activatedAt
                    }
                }`, variables: {input},
        }).toPromise()
            .then(({data}) => {
                return data.createSystemNotification;
            }).catch(error => { throw error; });
    }

    private update(id, input: SystemNotificationInput): Promise<SystemNotification> {
        return this.apollo.mutate<any>({
            mutation: gql`
                mutation updateSystemNotification($id: Int!, $input: SystemNotificationInput!) {
                    updateSystemNotification(id: $id, input:$input) {
                        id
                        level
                        message
                        activatedAt
                    }
                }`, variables: {id, input},
        }).toPromise()
            .then(({data}) => {
                return data.updateSystemNotification;
            }).catch(error => { throw error; });
    }

    private delete(id): Promise<SystemNotification> {
        return this.apollo.mutate<any>({
            mutation: gql`
              mutation deleteSystemNotification($id: Int!) {
                deleteSystemNotification(id: $id) {
                    id
                    level
                    message
                    activatedAt
                }
              }`, variables: {id},
        }).toPromise()
            .then(({data}) => {
                return data.deleteSystemNotification;
            }).catch(error => { throw error; });
    }
}
