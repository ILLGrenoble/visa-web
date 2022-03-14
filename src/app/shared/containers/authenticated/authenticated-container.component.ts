import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {
    AccountActions,
    ApplicationState,
    AuthenticationService,
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
    public notifications: SystemNotification[] = [];
    public dismissedNotifications: Array<number> = new Array<number>();
    private _timerSubscription: Subscription = null;


    constructor(private authenticationService: AuthenticationService,
                private notificationService: NotificationService,
                private dialog: MatDialog,
                private store: Store<ApplicationState>) {
        this.user$ = store.select(selectLoggedInUser).pipe(filter(user => !!user), take(1));
    }

    public ngOnInit(): void {

        this.user$.pipe(filter(user => user.id === '0')).subscribe(user => {
            this.dialog.open(InvalidAccountDialogComponent, {
                width: '550px',
            });
        });

        const dismissedNotificationsString = localStorage.getItem(AuthenticatedContainerComponent.DISMISSED_NOTIFICATIONS);
        if (dismissedNotificationsString != null && dismissedNotificationsString.length !== undefined) {
            dismissedNotificationsString.split(',').forEach(
                (element) => this.dismissedNotifications.push(Number(element))
            );
        }

        this._timerSubscription = timer(0, 30000).subscribe(
            () => this.notificationService.getAll().then((notifications) => {
                this.cleanDismissedNotifications(notifications);
                this.filterNotifications(notifications);
            }));
    }

    public ngOnDestroy(): void {
        this._timerSubscription.unsubscribe();
    }

    public handleLogout(): void {
        this.authenticationService.logout();
    }

    public dismissNotification(notification: SystemNotification): void {
        this.dismissedNotifications.push(notification.uid);
        localStorage.setItem(AuthenticatedContainerComponent.DISMISSED_NOTIFICATIONS, this.dismissedNotifications.join(','));
        this.filterNotifications(this.notifications);
    }

    private filterNotifications(notifications: SystemNotification[]): void {
        this.notifications = notifications.filter(notification => {
            return !this.dismissedNotifications.includes(notification.uid);
        });
    }

    private cleanDismissedNotifications(notifications): void {
        const notificationUIDs = notifications.map(notification => notification.uid);
        this.dismissedNotifications = this.dismissedNotifications.filter((dismissedNotification) => {
            return notificationUIDs.includes(dismissedNotification);
        });
        localStorage.setItem(AuthenticatedContainerComponent.DISMISSED_NOTIFICATIONS, this.dismissedNotifications.join(','));
    }

}
