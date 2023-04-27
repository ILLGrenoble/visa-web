import {Component, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {SystemNotification, SystemNotificationInput} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';
import {MatDialog} from '@angular/material/dialog';
import {NotificationUpdateComponent} from '../notification-update';
import * as moment from 'moment';
import {NotificationDeleteComponent} from '../notification-delete';
import {Title} from '@angular/platform-browser';
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

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
        this.fetch().subscribe((notifications) => {
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
                    .subscribe(() => this.onDataChange(notification));
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

            this.update(notification.id, {level: notification.level, message: notification.message, activatedAt: notification.activatedAt}).subscribe({
               next: (data) => {
                    notification.message = data.message;
                    notification.originalText = data.message;
                    notification.activatedAt = data.activatedAt;
                    notification.activated = notification.activatedAt != null;
                    notification.level = data.level;

                    this.showNotification('The system notification has been updated');
                },
                error: (error) => {
                    console.error(error);
                    this.showErrorNotification('Failed to update the system notification');
                }
            });

        } else {
            this.create({level: notification.level, message: notification.message, activatedAt: notification.activatedAt}).subscribe({
                next: (data) => {
                    notification.id = data.id;
                    notification.message = data.message;
                    notification.originalText = data.message;
                    notification.activatedAt = data.activatedAt;
                    notification.activated = notification.activatedAt != null;
                    notification.level = data.level;

                    this.showNotification('The system notification has been created');
                },
                error: (error) => {
                    console.error(error);
                    this.showErrorNotification('Failed to create the system notification');
                }
            });
        }
    }

    public onDelete(notification: SystemNotificationHolder): void {
        if (notification.id != null) {
            const dialogRef = this.dialog.open(NotificationDeleteComponent, {
                width: '400px',
            });
            dialogRef.componentInstance.onDelete$.subscribe(() => {
                this.delete(notification.id).subscribe({
                    next: () => {
                        this.notifications = this.notifications.filter((aNotification) => aNotification.id !== notification.id);

                        this.showNotification('The system notification has been deleted');
                    },
                    error: (error) => {
                        console.error(error);
                        this.showErrorNotification('Failed to delete the system notification');
                    }
                })
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

    public fetch(): Observable<SystemNotificationHolder[]> {
        return this.apollo.query<any>({
                query: gql`{
                systemNotifications {
                    id
                    level
                    message
                    activatedAt
                }
            }`,
            }).pipe(
                map(({data}) => {
                    return data.systemNotifications.map(({id, message, level, activatedAt}) => ({
                        id, message, level, activatedAt, originalText: message, activated: activatedAt !== null
                    }));
                }));
    }

    private create(input: SystemNotificationInput): Observable<SystemNotification> {
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
        }).pipe(
            map(({data}) => {
                return data.createSystemNotification;
            })
        );
    }

    private update(id, input: SystemNotificationInput): Observable<SystemNotification> {
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
        }).pipe(
            map(({data}) => {
                return data.updateSystemNotification;
            })
        );
    }

    private delete(id): Observable<SystemNotification> {
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
        }).pipe(
            map(({data}) => {
                return data.deleteSystemNotification;
            })
        );
    }
}
