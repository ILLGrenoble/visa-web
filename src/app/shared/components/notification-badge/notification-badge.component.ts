import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {ApplicationState, ClientNotification, selectAdminNotifications} from '../../../core';

@Component({
    selector: 'visa-notification-badge',
    styleUrls: ['./notification-badge.component.scss'],
    templateUrl: './notification-badge.component.html',
})
export class NotificationBadgeComponent implements OnInit , OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _clientNotifications: ClientNotification[];

    private _count: number;

    @Input()
    public badgeTags: string[];

    @Input()
    public showCount: boolean;

    get clientNotifications(): ClientNotification[] {
        return this._clientNotifications;
    }

    get isActive(): boolean {
        return this._clientNotifications?.length > 0;
    }

    get count(): number {
        return this._count;
    }

    constructor(private store: Store<ApplicationState>) {
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public ngOnInit(): void {

        this.store.select(selectAdminNotifications)
            .pipe(
                takeUntil(this._destroy$),
                filter(clientNotifications => !!clientNotifications),
                map((clientNotifications: ClientNotification[]) =>
                    clientNotifications.filter((clientNotification: ClientNotification) => {
                        if (this.badgeTags == null || this.badgeTags.length === 0) {
                            return true;
                        } else {
                            return this.badgeTags.includes(clientNotification.tag);
                        }
                    }))
            ).subscribe((clientNotifications: ClientNotification[]) => {
            this._clientNotifications = clientNotifications;
            this._count = this._clientNotifications.reduce((previousSum, notification) => previousSum + notification.count, 0);
        });
    }
}
