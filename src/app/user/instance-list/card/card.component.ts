import {Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {
    AccountService,
    Configuration,
    Instance,
    User,
    ApplicationState,
    selectLoggedInUser,
    GatewayEventSubscriber, EventsGateway, InstanceStateChangedEvent
} from '@core';
import {Observable, Subject, timer} from 'rxjs';
import {DetailsDialog, ExperimentsDialog, MembersDialog, RequestExtensionDialog} from '../dialogs';
import {MatDialog} from '@angular/material/dialog';
import {NotifierService} from 'angular-notifier';
import * as moment from 'moment';
import {Store} from '@ngrx/store';
import {filter,takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-instance-list-card',
    templateUrl: './card.component.html',
    // tslint:disable-next-line:no-host-metadata-property
    host: {
        '(document:click)': 'onDocumentClick($event)',
    },
    styleUrls: ['./card.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class CardComponent implements OnInit, OnDestroy {

    private _user$: Observable<User>;
    private _user: User;

    private _instance: Instance;
    private _configuration: Configuration;
    private _requestExtensionEnabled = false;
    private _gatewayEventSubscriber: GatewayEventSubscriber;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    @ViewChild('dropdown')
    public dropdownElement: ElementRef;

    @Output()
    public doUpdateParent: Subject<void> = new Subject();

    @Input()
    set instance(value: Instance) {
        this._instance = value;
        this.onStateChanged();
    }

    get instance(): Instance {
        return this._instance;
    }

    @Input()
    set configuration(value: Configuration) {
        this._configuration = value;
    }

    get requestExtensionEnabled(): boolean {
        return this._requestExtensionEnabled;
    }

    get user(): User {
        return this._user;
    }

    public isSettingsOpen = false;

    public expirationCountdown = '';
    public canConnect = false;

    constructor(private ref: ElementRef,
                private notifierService: NotifierService,
                private dialog: MatDialog,
                store: Store<ApplicationState>,
                private accountService: AccountService,
                private eventsGateway: EventsGateway) {
        this._user$ = store.select(selectLoggedInUser);
    }

    public ngOnInit(): void {
        this._user$.pipe(filter((user) => user != null)).subscribe((user) => {
            this._user = user;
        });

        this.bindEventGatewayListeners();

        timer(0, 30000).pipe(
            takeUntil(this._destroy$),
        ).subscribe(() => {
            this.updateExpirationCountdown();
        });
    }

    public ngOnDestroy(): void {
        this.unbindEventGatewayListeners();
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public toggleSettings(): void {
        this.isSettingsOpen = !this.isSettingsOpen;
    }

    public onDocumentClick(event): void {
        if (!this.ref.nativeElement.contains(event.target)) {
            this.isSettingsOpen = false;
        }
    }

    public onDetailsClicked($event): void {
        $event.preventDefault();
        this.toggleSettings();
        const dialogRef = this.dialog.open(DetailsDialog, {
            width: '1000px',
            data: {instance: this.instance},
        });

        dialogRef.afterClosed().subscribe(({instance, reboot}) => {
            if (instance) {
                this.notifierService.notify('success', 'Successfully updated instance details');
                this.doUpdateParent.next();
            }
            if (reboot) {
                this.accountService.instanceReboot(this.instance).subscribe((instance) => {
                    this.instance = instance;
                    this.notifierService.notify('success', 'Rebooting instance');
                });
            }
        });
    }

    public onMembersClicked(event): void {
        event.preventDefault();
        this.toggleSettings();
        const dialogRef = this.dialog.open(MembersDialog, {
            width: '1000px',
            data: {instance: this.instance},
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result == null) {
                return;
            }
            this.notifierService.notify('success', 'Successfully updated members');
        });
    }

    public onExperimentsClicked(event): void {
        event.preventDefault();
        this.toggleSettings();
        this.dialog.open(ExperimentsDialog, {
            width: 'max(1000px, 70%)',
            data: {experiments: this.instance.experiments},
        });
    }

    public canStartInstance(): boolean {
        return this.instance.state === 'STOPPED' && this.instance.membership.isRole('OWNER');
    }

    public canShutdownInstance(): boolean {
        return ['STARTING', 'PARTIALLY_ACTIVE', 'ACTIVE'].includes(this._instance.state) && this.instance.membership.isRole('OWNER');
    }

    public canRebootInstance(): boolean {
        return ['STARTING', 'PARTIALLY_ACTIVE', 'ACTIVE'].includes(this._instance.state) && this.instance.membership.isRole('OWNER');
    }

    public canAccessJupyter(): boolean {
        const hasJupyterProtocol = this.instance.hasProtocolWithName('JUPYTER');

        return (this.canConnect &&  hasJupyterProtocol && this.instance.membership.isRole('OWNER'));
    }

    public multiEnvAvailable(): boolean {
        return this.canAccessJupyter();
    }

    public isOwner(): boolean {
        return this.instance.membership.isRole('OWNER');
    }

    public onRebootClicked(event): void {
        event.preventDefault();
        this.toggleSettings();

        this.accountService.instanceReboot(this.instance).subscribe((instance) => {
            this.instance = instance;
            this.notifierService.notify('success', 'Rebooting instance');
        });
    }

    public onShutdownClicked(event): void {
        event.preventDefault();
        this.toggleSettings();

        this.accountService.instanceShutdown(this.instance).subscribe((instance) => {
            this.instance = instance;
            this.notifierService.notify('success', 'Shutting down instance');
        });
    }

    public onDeleteClicked(event): void {
        event.preventDefault();
        if (this.isSettingsOpen) {
            this.isSettingsOpen = false;
        }
        if (this.instance.membership.isRole('OWNER')) {
            const confirmation = window.confirm('Are you sure you want to delete this instance?');
            if (confirmation) {
                this.accountService.deleteInstance(this.instance).subscribe((instance) => {
                    this.instance = instance;
                    this.notifierService.notify('success', 'Your instance is being deleted');
                });
            }
        }
    }

    public onStartClicked(event): void {
        event.preventDefault();
        this.toggleSettings();

        this.accountService.instanceStart(this.instance).subscribe((instance) => {
            this.instance = instance;
            this.notifierService.notify('success', 'Your instance is starting');
        });

    }

    public getCpuView(): string {
        if (this.instance && this.instance.plan.flavour) {
            return this.instance.plan.flavour.cpu + ' VCPU' + (this.instance.plan.flavour.cpu !== 1 ? 's' : '');
        }
        return null;
    }

    public getRamView(): string {
        if (this.instance && this.instance.plan.flavour) {
            return (Math.round(this.instance.plan.flavour.memory / 1024 * 10) / 10) + ' GB RAM';
        }
        return null;
    }

    public willExpireWarning(): boolean {
        if (this.willExpireCritical()) {
            return false;
        }

        if (this.willExpireFromInactivity()) {
            // Show warning 24 hours if expiring due to inactivity
            return this.instance.willExpireInHours(24);

        } else {
            // Show warning 48 hours in advance if expiring due to lifetime
            return this.instance.willExpireInHours(48);
        }
    }

    public willExpireCritical(): boolean {
        return this.instance.willExpireInHours(1);
    }

    public willExpireFromInactivity(): boolean {
        if (this.instance.terminationDate == null) {
            return false;
        }
        const terminationDate = moment(this.instance.terminationDate).format('YYYY-MM-DD hh:mm');
        const expirationDate = moment(this.instance.expirationDate).format('YYYY-MM-DD hh:mm');
        return terminationDate !== expirationDate;
    }

    public requestExtension($event): void {
        $event.preventDefault();
        const dialogRef = this.dialog.open(RequestExtensionDialog, {
            width: '1000px',
            data: {instance: this._instance, configuration: this._configuration},
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result == null) {
                return;
            }
            this.notifierService.notify('success', 'Successfully requested lifetime extension');
            this._requestExtensionEnabled = false;
        });

    }

    private updateInstanceFromStateEvent(event: InstanceStateChangedEvent): void {
        if (this._instance == null || this._instance.plan == null) {
            return;
        }

        this._instance.name = event.name;
        this._instance.comments = event.comments;
        this._instance.state = event.state;
        this._instance.ipAddress = event.ipAddress
        this._instance.terminationDate = event.terminationDate;
        this._instance.expirationDate = event.expirationDate;
        this._instance.deleteRequested = event.deleteRequested;
        this._instance.unrestrictedAccess = event.unrestrictedMemberAccess;
        this._instance.activeProtocols = event.activeProtocols;
        this._instance.vdiProtocol = event.vdiProtocol ? event.vdiProtocol : this._instance.vdiProtocol;

        this.onStateChanged();
    }

    private onStateChanged() {
        if ((this._instance.state === 'STOPPED' || this._instance.state === 'STOPPING'
            || this._instance.state === 'ACTIVE' || this._instance.state === 'PARTIALLY_ACTIVE') && this._instance.deleteRequested) {
            this._instance.state = 'DELETING';
        }

        this.updateCanConnect();
        this.updateExpirationCountdown();

        if (this._instance.state === 'DELETED') {
            this.doUpdateParent.next(null);
        }

        if (this.willExpireWarning() && !this.willExpireFromInactivity()) {
            this.accountService.getInstanceLifetimeExtension(this._instance).subscribe((instanceLifetimeExtension) => {
                this._requestExtensionEnabled = (instanceLifetimeExtension == null);
            });
        }
    }

    private updateCanConnect(): void {
        if (this._instance != null && (this._instance.state === 'ACTIVE' || this._instance.state === 'PARTIALLY_ACTIVE')) {
            if (this._instance.membership.role === 'OWNER') {
                this.canConnect = true;

            } else if (this._instance.canConnectWhileOwnerAway) {
                this.canConnect = true;

            } else {
                this.accountService.getSessionMembersForInstance(this._instance).subscribe((sessionMembers) => {
                    this.canConnect = sessionMembers.length > 0;
                });
            }

        } else {
            this.canConnect = false;
        }
    }

    private updateExpirationCountdown(): void {
        if (this.instance.expirationDate instanceof Date) {
            const second = 1000;
            const minute = second * 60;
            const hour = minute * 60;

            const durationMs = (this.instance.expirationDate.getTime() - new Date().getTime());
            const hours = Math.floor(durationMs / hour);
            const minutes = Math.floor((durationMs % hour) / minute);

            if (durationMs > hour) {
                this.expirationCountdown = ` in ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;

            } else if (durationMs > 0) {
                this.expirationCountdown = ` in ${minutes} minute${minutes > 1 ? 's' : ''}`;

            } else {
                this.expirationCountdown = '';
            }

        } else {
            this.expirationCountdown = '';
        }
    }

    private bindEventGatewayListeners(): void {
        this._gatewayEventSubscriber = this.eventsGateway.subscribe()
            .on('user:instance_state_changed', (event: InstanceStateChangedEvent) => {
                if (event.instanceId === this._instance.id) {
                    this.updateInstanceFromStateEvent(event);
                }
            })
    }

    private unbindEventGatewayListeners(): void {
        if (this._gatewayEventSubscriber != null) {
            this.eventsGateway.unsubscribe(this._gatewayEventSubscriber);
            this._gatewayEventSubscriber = null;
        }
    }
}
