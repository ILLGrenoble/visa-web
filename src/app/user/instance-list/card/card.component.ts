import {Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {AccountService, Instance} from '@core';
import {Subject, Subscription, timer} from 'rxjs';
import {DetailsDialog, ExperimentsDialog, MembersDialog} from '../dialogs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';

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

    private static ACTIVE_UPDATE_PERIOD = 1000;
    private static BACKGROUND_UPDATE_PERIOD = 30000;

    private _instance: Instance;

    @ViewChild('dropdown')
    public dropdownElement: ElementRef;

    @Output()
    public doUpdateParent: Subject<null> = new Subject();

    @Input()
    set instance(value: Instance) {
        this._instance = value;
        this.updateInstanceState();
    }

    get instance(): Instance {
        return this._instance;
    }

    public isSettingsOpen = false;

    private _currentUpdatePeriod = 0;
    private _timerSubscription: Subscription = null;
    public expirationCountdown = '';
    public canConnect = false;

    constructor(private ref: ElementRef,
                private snackBar: MatSnackBar,
                private dialog: MatDialog,
                private accountService: AccountService) {

    }

    public ngOnInit(): void {
        this.updateInstanceState();
    }

    public ngOnDestroy(): void {
        this.stopUpdateTimers();
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

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.snackBar.open('Successfully updated instance details', 'OK', {
                    duration: 2000,
                });
                this.doUpdateParent.next();
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
            this.snackBar.open('Successfully updated members', 'OK', {
                duration: 2000,
            });
        });
    }

    public onExperimentsClicked(event): void {
        event.preventDefault();
        this.toggleSettings();
        const dialogRef = this.dialog.open(ExperimentsDialog, {
            width: 'max(1000px, 70%)',
            data: {experiments: this.instance.experiments},
        });
    }

    public canStartInstance(): boolean {
        return this.instance.state === 'STOPPED' && this.instance.membership.isRole('OWNER');
    }

    public canShutdownInstance(): boolean {
        return this.instance.state === 'ACTIVE' && this.instance.membership.isRole('OWNER');
    }

    public canRebootInstance(): boolean {
        return this.instance.state === 'ACTIVE' && this.instance.membership.isRole('OWNER');
    }

    public canAccessJupyter(): boolean {
        const hasJupyterProtocol = this.instance.plan.image.hasProtocolWithName('JUPYTER');

        return (this.canConnect &&  hasJupyterProtocol && this.instance.membership.isRole('OWNER'));
    }

    public onRebootClicked(event): void {
        event.preventDefault();
        this.toggleSettings();

        this.accountService.instanceReboot(this.instance).subscribe((instance) => {
            this.instance = instance;
            this.snackBar.open('Rebooting instance', 'OK', {
                duration: 2000,
            });
        });
    }

    public onShutdownClicked(event): void {
        event.preventDefault();
        this.toggleSettings();

        this.accountService.instanceShutdown(this.instance).subscribe((instance) => {
            this.instance = instance;
            this.snackBar.open('Shutting down instance', 'OK', {
                duration: 2000,
            });
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
                    this.snackBar.open('Your instance is being deleted', 'OK', {
                        duration: 4000,
                    });
                });
            }
        }
    }

    public onStartClicked(event): void {
        event.preventDefault();
        this.toggleSettings();

        this.accountService.instanceStart(this.instance).subscribe((instance) => {
            this.instance = instance;
            this.snackBar.open('Your instance is starting.', 'OK', {
                duration: 2000,
            });
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
            return (Math.round(this.instance.plan.flavour.memory / 1024 * 10) / 10) + ' GB';
        }
        return null;
    }

    public willExpireIn24Hours(): boolean {
        return !this.willExpireIn1Hour() && this.instance.willExpireInHours(24);
    }

    public willExpireIn1Hour(): boolean {
        return this.instance.willExpireInHours(1);
    }

    public willExpireFromInactivity(): boolean {
        return this.instance.terminationDate != null && this.instance.terminationDate.getTime() !== this.instance.expirationDate.getTime();
    }

    public getThumbnailUrl(): string {
        return this.accountService.getThumbnailUrlForInstance(this.instance);
    }

    private updateInstanceState(): void {
        if (this._instance == null || this._instance.plan == null) {
            this.stopUpdateTimers();
            return;
        }

        this.updateCanConnect();

        this.accountService.getInstanceState(this._instance).subscribe((instanceState) => {
            if ((instanceState.state === 'STOPPED' || instanceState.state === 'STOPPING'
                || instanceState.state === 'ACTIVE') && instanceState.deleteRequested) {
                this._instance.state = 'DELETING';
            } else {
                this._instance.state = instanceState.state;
            }
            this._instance.expirationDate = new Date(instanceState.expirationDate);
            this._instance.terminationDate = new Date(instanceState.terminationDate);

            this.updateExpirationCountdown();

            if (instanceState.state === 'DELETED') {
                this.doUpdateParent.next(null);
            }

            if (['UNKNOWN', 'STARTING', 'REBOOTING', 'BUILDING', 'STOPPING', 'DELETING'].includes(this._instance.state)) {
                this.restartUpdateTimers(CardComponent.ACTIVE_UPDATE_PERIOD);

            } else {
                this.restartUpdateTimers(CardComponent.BACKGROUND_UPDATE_PERIOD);

            }
        }, (error) => {
            this.stopUpdateTimers();

            this.doUpdateParent.next(null);
        });
    }

    private updateCanConnect(): void {
        if (this._instance != null && this._instance.state === 'ACTIVE') {
            if (this._instance.membership.role === 'OWNER') {
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
        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;

        const durationMs = (this.instance.expirationDate.getTime() - new Date().getTime());
        const hours = Math.floor(durationMs / (hour));
        const minutes = Math.floor((durationMs % (hour)) / (minute));

        if (durationMs > hour) {
            this.expirationCountdown = ` in about ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}.`;

        } else if (durationMs > 0) {
            this.expirationCountdown = ` in about ${minutes} minute${minutes > 1 ? 's' : ''}.`;

        } else {
            this.expirationCountdown = '.';
        }
    }

    private restartUpdateTimers(period): void {
        if (this._currentUpdatePeriod === period) {
            return;
        }

        this.stopUpdateTimers();

        this._currentUpdatePeriod = period;
        const observable = timer(0, period);
        this._timerSubscription = observable.subscribe((t) => this.updateInstanceState());
    }

    private stopUpdateTimers(): void {
        if (this._timerSubscription != null) {
            this._timerSubscription.unsubscribe();
            this._timerSubscription = null;
        }
    }
}
