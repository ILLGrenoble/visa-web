import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {
    ApplicationState,
    AuthenticationService, BookingUserConfiguration,
    ClientNotification, EventsGateway, GatewayEventSubscriber, NotificationPayload,
    NotificationService, selectAdminNotifications,
    selectLoggedInUser, selectUserBookingConfiguration,
    SystemNotification,
    User,
} from '@core';
import {Store} from '@ngrx/store';
import {Observable, Subject} from 'rxjs';
import {InvalidAccountDialogComponent} from '../../components';
import {filter, take, takeUntil} from 'rxjs/operators';
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
    public bookingConfig$: Observable<BookingUserConfiguration>;
    public systemNotifications: SystemNotification[] = [];
    public dismissedSystemNotifications: Array<number> = new Array<number>();
    private _gatewayEventSubscriber: GatewayEventSubscriber;
    private _adminBadgeColor: string;

    get adminBadgeColor(): string {
        return this._adminBadgeColor;
    }

    constructor(private authenticationService: AuthenticationService,
                private notificationService: NotificationService,
                private dialog: MatDialog,
                private store: Store<ApplicationState>,
                private eventsGateway: EventsGateway) {
    }

    public ngOnInit(): void {

        this.user$ = this.store.select(selectLoggedInUser).pipe(filter(user => !!user), take(1));
        this.bookingConfig$ = this.store.select(selectUserBookingConfiguration).pipe(filter(bookingConfig => !!bookingConfig), take(1));

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
            })
            .on('admin:booking_requests_changed', _ => {
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

            const adminNotifications = notificationPayload.adminNotifications || [];
            const hasNoErrorNotification = adminNotifications.filter(notification => ['instance.errors'].includes(notification.tag)).length == 0;
            if (hasNoErrorNotification) {
                this._adminBadgeColor = '#ff9f43';
            } else {
                this._adminBadgeColor = null;
            }

        });
    }

}
