import {Component, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {SystemNotificationInput} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';
import * as moment from 'moment';
import {Title} from '@angular/platform-browser';
import {Subject} from "rxjs";
import {map, takeUntil} from "rxjs/operators";

interface SystemNotificationHolder {
    id: number,
    message: string;
    level: string;
    type: string;
    activated: boolean;
    activatedAt: string;
    originalText: string;
}

@Component({
    selector: 'visa-admin-notifications',
    styleUrls: ['./notifications.component.scss'],
    templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit, OnDestroy {

    public notifications: SystemNotificationHolder[];
    private activeNotification: SystemNotificationHolder;

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _notificationToDelete: SystemNotificationHolder;
    private _notificationToUpdate: SystemNotificationHolder;

    get showDeleteModal(): boolean {
        return this._notificationToDelete != null;
    }

    get showUpdateModal(): boolean {
        return this._notificationToUpdate != null;
    }

    get canUpdate(): boolean {
        return this._notificationToUpdate?.message.length <= 4096;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private titleService: Title) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Notifications | Settings | Admin | VISA`);
        this.load();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public addRow(): void {
        this.notifications.push({
            id: null,
            message: '',
            level: 'INFO',
            type: 'BANNER',
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
            this._notificationToUpdate = notification;

        } else {
            this.onDataChange(notification);
        }
    }

    public onConfirmTextChange(): void {
        this.onDataChange(this._notificationToUpdate);
    }

    public onUpdateModalClosed(): void {
        this._notificationToUpdate = null;
    }

    public onDataChange(notification: SystemNotificationHolder): void {
        if (notification.message === '') {
            return;
        }

        if (notification.id) {
            notification.activatedAt = notification.activatedAt != null ? moment(new Date()).format('YYYY-MM-DD hh:mm:ss') : null;
            this.update(notification.id, {level: notification.level, type: notification.type, message: notification.message, activatedAt: notification.activatedAt});

        } else {
            this.create({level: notification.level, type: notification.type, message: notification.message, activatedAt: notification.activatedAt});
        }
    }

    public onDelete(notification: SystemNotificationHolder): void {
        if (notification.id != null) {
            this._notificationToDelete = notification;

        } else {
            this.notifications = this.notifications.filter(aNotification => aNotification !== notification);
        }
    }

    public onConfirmDelete(): void {
        this.apollo.mutate<any>({
            mutation: gql`
              mutation deleteSystemNotification($id: Int!) {
                deleteSystemNotification(id: $id) {
                    id
                }
              }`, variables: {id: this._notificationToDelete.id},
        }).pipe(
            takeUntil(this._destroy$),
            map(({data}) => {
                return data.deleteSystemNotification;
            })).subscribe({
                next: () => {
                    this._notificationToDelete = null;
                    this.notifierService.notify('success','The system notification has been deleted');
                    this.load();
                },
                error: (error) => {
                    this.notifierService.notify('error',error);
                }
            });
    }

    public onDeleteModalClosed(): void {
        this._notificationToDelete = null;
    }

    private load(): void {
        this.apollo.query<any>({
            query: gql`{
                systemNotifications {
                    id
                    level
                    type
                    message
                    activatedAt
                }
            }`,
            }).pipe(
                takeUntil(this._destroy$),
                map(({data}) => {
                    return data.systemNotifications.map(({id, message, level, type, activatedAt}) => ({
                        id, message, level, type, activatedAt, originalText: message, activated: activatedAt !== null
                    }));
                })
            ).subscribe(notifications => {
                this.notifications = notifications;
            });
    }

    setActiveNotification(notification: SystemNotificationHolder): void {
        this.activeNotification = notification;
    }

    getMessageRows(notification: SystemNotificationHolder): number {
        if (this.activeNotification?.id === notification.id) {
            return 10;
        }
        return 1;
    }

    private create(input: SystemNotificationInput): void {
        this.apollo.mutate<any>({
            mutation: gql`
                mutation create($input: SystemNotificationInput!) {
                    createSystemNotification(input: $input) {
                        id
                    }
                }`, variables: {input},
        }).pipe(
            takeUntil(this._destroy$),
        ).subscribe({
            next: () => {
                this.notifierService.notify('success','The system notification has been created');
                this.load();
            },
            error: (error) => {
                this.notifierService.notify('error', error);
            }
        });
    }

    private update(id, input: SystemNotificationInput): void {
        this.apollo.mutate<any>({
            mutation: gql`
                mutation updateSystemNotification($id: Int!, $input: SystemNotificationInput!) {
                    updateSystemNotification(id: $id, input:$input) {
                        id
                    }
                }`, variables: {id, input},
        }).pipe(
            takeUntil(this._destroy$),
        ).subscribe({
            next: () => {
                this._notificationToUpdate = null;
                this.notifierService.notify('success','The system notification has been updated');
                this.load();
            },
            error: (error) => {
                this.notifierService.notify('error', error);
            }
        });
    }
}
