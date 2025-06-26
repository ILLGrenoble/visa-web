import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {
    ApplicationState,
    AuthenticationService, EventsGateway, GatewayEventSubscriber, NotificationPayload,
    NotificationService,
    selectLoggedInUser,
    SystemNotification,
    User,
} from '@core';
import {Store} from '@ngrx/store';
import {Observable, Subscription, timer} from 'rxjs';
import {InvalidAccountDialogComponent} from '../../components';
import {filter, take} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'visa-authenticated-container',
    styleUrls: ['./authenticated-container.component.scss'],
    templateUrl: './authenticated-container.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class AuthenticatedContainerComponent implements OnInit, OnDestroy {

    private static DISMISSED_NOTIFICATIONS = 'authenticated.dismissed.notifications';
    public user$: Observable<User>;
    public systemNotifications: SystemNotification[] = [];
    public dismissedSystemNotifications: Array<number> = new Array<number>();
    private _gatewayEventSubscriber: GatewayEventSubscriber;

    constructor(private authenticationService: AuthenticationService,
                private notificationService: NotificationService,
                private dialog: MatDialog,
                store: Store<ApplicationState>,
                private eventsGateway: EventsGateway) {
        this.user$ = store.select(selectLoggedInUser).pipe(filter(user => !!user), take(1));
    }

    public ngOnInit(): void {

        this.user$.pipe(filter(user => user.id === '0')).subscribe(() => {
            this.dialog.open(InvalidAccountDialogComponent, {
                width: '550px',
            });
        });

        const dismissedNotificationsString = localStorage.getItem(AuthenticatedContainerComponent.DISMISSED_NOTIFICATIONS);
        if (dismissedNotificationsString != null && dismissedNotificationsString.length !== undefined) {
            dismissedNotificationsString.split(',').forEach(
                (element) => this.dismissedSystemNotifications.push(Number(element))
            );
        }

        this.getNotifications();
        this.bindEventGatewayListeners();
    }

    public ngOnDestroy(): void {
        this.unbindEventGatewayListeners();
    }

    public handleLogout(): void {
        this.authenticationService.logout();
    }

    public dismissSystemNotification(systemNotification: SystemNotification): void {
        this.dismissedSystemNotifications.push(systemNotification.uid);
        localStorage.setItem(AuthenticatedContainerComponent.DISMISSED_NOTIFICATIONS, this.dismissedSystemNotifications.join(','));
        this.filterSystemNotifications(this.systemNotifications);
    }

    private filterSystemNotifications(systemNotifications: SystemNotification[]): void {
        this.systemNotifications = systemNotifications
            .filter(notification => notification.type == null || notification.type === 'BANNER')
            .filter(notification => {
                return !this.dismissedSystemNotifications.includes(notification.uid);
            });
    }

    private cleanDismissedSystemNotifications(systemNotifications: SystemNotification[]): void {
        const notificationUIDs = systemNotifications.map(notification => notification.uid);
        this.dismissedSystemNotifications = this.dismissedSystemNotifications.filter((dismissedNotification) => {
            return notificationUIDs.includes(dismissedNotification);
        });
        localStorage.setItem(AuthenticatedContainerComponent.DISMISSED_NOTIFICATIONS, this.dismissedSystemNotifications.join(','));
    }

    private bindEventGatewayListeners(): void {
        this._gatewayEventSubscriber = this.eventsGateway.subscribe()
            .on('global:notifications_changed', _ => {
                this.getNotifications();
            })
            .on('admin:extension_requests_changed', _ => {
                this.getNotifications();
            })
            .on('admin:instance_errors_changed', _ => {
                this.getNotifications();
            });
    }

    private unbindEventGatewayListeners(): void {
        if (this._gatewayEventSubscriber != null) {
            this.eventsGateway.unsubscribe(this._gatewayEventSubscriber);
            this._gatewayEventSubscriber = null;
        }
    }

    private getNotifications(): void {
        this.notificationService.getAll().subscribe((notificationPayload: NotificationPayload) => {
            const systemNotifications = notificationPayload.systemNotifications;

            this.cleanDismissedSystemNotifications(systemNotifications);
            this.filterSystemNotifications(systemNotifications);
        });
    }

}
