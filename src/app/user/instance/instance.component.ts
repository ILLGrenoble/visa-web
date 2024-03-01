import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {
    AccountService,
    AnalyticsService,
    ApplicationState,
    ConfigService,
    Instance,
    selectLoggedInUser,
    User
} from '@core';
import {
    ScaleMode,
    VirtualDesktopManager,
    GuacamoleVirtualDesktopManager,
    WebXVirtualDesktopManager,
    DesktopConnection
} from '@vdi';
import {NotifierService} from 'angular-notifier';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import * as md5 from 'blueimp-md5';
import * as FileSaver from 'file-saver';
import {BehaviorSubject, combineLatest, interval, Observable, Subject, Subscription, throwError, timer} from 'rxjs';
import {catchError, filter, finalize, map, scan, share, startWith, takeUntil, timeInterval} from 'rxjs/operators';
import {AccessRequestComponent} from './access-request';
import {ClipboardComponent} from './clipboard';
import {KeyboardComponent} from './keyboard';
import {MembersConnectedComponent} from './members-connected';
import {SettingsComponent} from './settings';
import {Store} from '@ngrx/store';
import {UrlComponent} from './url';
import {FileManagerComponent} from "./file-manager";
import {environment} from 'environments/environment';
import {de} from "./keyboard/layouts";

@Component({
    encapsulation: ViewEncapsulation.None,
    templateUrl: './instance.component.html',
    styleUrls: ['./instance.component.scss'],
})
export class InstanceComponent implements OnInit, OnDestroy {

    public manager: VirtualDesktopManager;
    public instance: Instance;

    public error: string = null;

    public user: User;

    public users$: BehaviorSubject<[]> = new BehaviorSubject<[]>([]);

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _desktopConnection: DesktopConnection = new DesktopConnection();

    public stats$;

    /**
     * Hot keys
     */
    private hotkeys: Hotkey[] = [];

    /**
     * Update the stats for the connection every 1 second
     */
    private statsInterval$;


    /**
     * Subscription for the remote desktop state
     */
    private state$;

    public ownerNotConnected = false;
    public accessPending = false;
    public accessRevoked = false;
    private unlockedRole: string = null;

    private thumbnailChecksum: string = null;

    private thumbnailInterval$: Subscription;
    private _timeElapsed$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _totalDataReceived$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private _dataReceivedRate$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private dataReceivedMessages$: Subscription;
    private clipboard$: Subscription;

    private _useWebX = true;

    get timeElapsed$(): BehaviorSubject<number> {
        return this._timeElapsed$;
    }

    get totalDataReceived$(): BehaviorSubject<number> {
        return this._totalDataReceived$;
    }

    get dataReceivedRate$(): BehaviorSubject<number> {
        return this._dataReceivedRate$;
    }

    constructor(private route: ActivatedRoute,
                private router: Router,
                private accountService: AccountService,
                private dialog: MatDialog,
                private hotkeysService: HotkeysService,
                private titleService: Title,
                private notifierService: NotifierService,
                private analyticsService: AnalyticsService,
                private store: Store<ApplicationState>,
                private configurationService: ConfigService) {
    }

    public ngOnInit(): void {
        this.createAndBindHotkeys();
        const instanceId = this.route.snapshot.paramMap.get('id');

        this._useWebX = this.route.snapshot.data.useWebX != null ? this.route.snapshot.data.useWebX : false;
        this.accountService.getInstance(instanceId).subscribe({
            next: (instance) => {
                this.setInstance(instance);
                this.handleConnect();
            },
            error: (error) => {
                if (error.status === 404) {
                    this.error = 'The requested instance does not exist';

                } else {
                    this.error = 'Failed to connect to the instance';
                }
            }
        });
        this.store.select(selectLoggedInUser).subscribe((user: User) => this.user = user);

        document.body.addEventListener('offline', () => {
            this._desktopConnection.disconnect();
        }, false);
    }

    /**
     * Clean up handlers and disconnect from services
     */
    public ngOnDestroy(): void {
        this.closeAllDialogs();
        this.unbindManagerHandlers();
        this.unbindHotkeys();
        this.unbindManagerHandlers();
        this.unbindWindowListeners();
        if (this.manager) {
            this.manager.disconnect();
            this.manager = null;
        }
        this._desktopConnection.disconnect();

        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    /**
     * Open the keyboard dialog
     */
    public handleKeyboard(): void {
        if (this.dialog.getDialogById('keyboard-dialog') === undefined) {
            this.createKeyboardDialog();
        }
    }

    /**
     * Connect to the remote desktop
     */
    public handleConnect(): void {
        this.ownerNotConnected = false;
        this.error = null;
        this.accessPending = false;
        this.accessRevoked = false;
        this.createAuthenticationTicket().subscribe(ticket => {
            this._desktopConnection.connect({token: ticket, path: environment.paths.ws.connector}).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: (desktopEvent) => {
                    this.handleDesktopEvent(desktopEvent.event, desktopEvent.data);
                },
                complete: () => {
                    console.log('!!! DesktopConnection events completed !!!');
                    if (this.manager) {
                        this.manager.disconnect();
                    }
                    this.closeAllDialogs();
                }
            });
        });
    }

    /**
     * Create a screenshot
     */
    public handleScreenshot(): void {
        this.createScreenshot();
    }

    /**
     * Open the clipboard dialog
     */
    public handleClipboard(): void {
        this.createClipboardDialog();
    }

    /**
     * Open the settings dialog
     */
    public handleSettings(): void {
        this.createSettingsDialog();
    }

    /**
     * Open the members connected dialog
     */
    public handleMembersConnected(): void {
        this.createMembersConnectedDialog();
    }

    /**
     * Open the file manager dialog
     */
    public handleFileManager(): void {
        this.createFileManagerDialog();
    }

    /**
     * Enter into full screen mode
     */
    public toggleScaledMode(): void {
        if (this.manager.getScaleMode() === ScaleMode.Scaled) {
            // this.manager.setScaleMode(ScaleMode.Unscaled);
            this.manager.setScaleMode(ScaleMode.Optimal);
            // } else if (this.manager.getScaleMode() === ScaleMode.Unscaled) {
            //     this.manager.setScaleMode(ScaleMode.Optimal);
        } else if (this.manager.getScaleMode() === ScaleMode.Optimal) {
            this.manager.setScaleMode(ScaleMode.Scaled);
        }
    }

    public isDisplayScaled(): boolean {
        return this.manager.getScaleMode() === ScaleMode.Scaled;
    }

    public isDisplayUnscaled(): boolean {
        return this.manager.getScaleMode() === ScaleMode.Unscaled;
    }

    public isDisplayOptimal(): boolean {
        return this.manager.getScaleMode() === ScaleMode.Optimal;
    }

    public isFilesAvailable(): boolean {
        return this.instance?.membership.role === 'OWNER' && this.manager.isConnected() && this.instance?.hasProtocolWithName('VISA_FS');
    }

    public isPrinterAvailable(): boolean {
        return this.instance?.membership.role === 'OWNER' && this.instance?.hasProtocolWithName('VISA_PRINT');
    }

    /**
     * Enter into full screen mode
     */
    public handleEnterFullScreen(): void {
        this.manager.setFullScreen(true);
    }

    /**
     * Exit out of full screen mode
     */
    public handleExitFullScreen(): void {
        this.manager.setFullScreen(false);
    }

    /**
     * Generate a screenshot of the remote desktop and download to the client
     */
    private createScreenshot(): void {
        this.manager.createScreenshot().then((blob) => {
            if (blob) {
                FileSaver.saveAs(blob, `screenshot.png`);
            }
        });
    }

    private setInstance(instance: Instance): void {
        const title = `${instance.name} (${instance.id}) | Instances | VISA`;
        this.titleService.setTitle(title);
        this.analyticsService.trackPageView(title);
        this.instance = instance;
    }

    /**
     * If the manager does not exist, create it.
     */
    private createManager(): void {
        if (this.manager) {
            return;
        }
        if (this._useWebX) {
            const tunnel = this.accountService.createWebXRemoteDesktopTunnel();
            this.manager = new WebXVirtualDesktopManager(tunnel);

        } else {
            const tunnel = this.accountService.createGuacamoleRemoteDesktopTunnel();
            this.manager = new GuacamoleVirtualDesktopManager(tunnel);
        }
    }

    /**
     * Create an authentication ticket and then connect to the remote desktop
     * Bind the manager handlers
     */
    private createAuthenticationTicket(): Observable<string> {
        return this.accountService.createInstanceAuthenticationTicket(this.instance).pipe(
            takeUntil(this._destroy$),
            filter((ticket: string) => ticket !== null),
            catchError(error => {
                if (error.status === 401) {
                    this.error = 'Failed to connect: the instance owner has not connected';

                } else {
                    this.error = 'Failed to connect to the instance';
                }
                return throwError(error);
            })
        );
    }

    /**
     * Bind all manager handlers
     */
    private bindManagerHandlers(): void {
        this.handleTunnelInstructionMessages();
        this.handleState();
        this.handleThumbnailGeneration();
        this.handleClipboardData();
        this.bindWindowListeners();
    }

    /**
     * Unbind all of the manager handlers
     */
    private unbindManagerHandlers(): void {
        if (this.statsInterval$) {
            this.statsInterval$.unsubscribe();
        }
        if (this.dataReceivedMessages$) {
            this.dataReceivedMessages$.unsubscribe();
        }
        if (this.state$) {
            this.state$.unsubscribe();
        }
        if (this.thumbnailInterval$) {
            this.thumbnailInterval$.unsubscribe();
        }
        if (this.clipboard$) {
            this.clipboard$.unsubscribe();
        }
    }
    /**
     * Handle the current state of the remote desktop connection
     * If the state is disconnected, unbind all of the manager handles and close any relevant open dialogs
     */
    private handleState(): void {
        this.state$ = this.manager.onStateChange.subscribe((state) => {
            if (state === 'DISCONNECTED') {
                this._desktopConnection.disconnect();

                this.removeDialog('keyboard-dialog');
                this.removeDialog('clipboard-dialog');

                this.unbindManagerHandlers();

            } else if (state === 'CONNECTED') {
                this.accessPending = false;
            }
        });
    }

    private handleThumbnailGeneration() {
        if (!this.thumbnailInterval$ && this.instance.membership.isRole('OWNER', 'SUPPORT')) {
            // take a screenshot every minute
            this.thumbnailInterval$ = timer(10000, 60000).subscribe(() => {
                if (this.manager.isConnected()) {
                    const {screenHeight, screenWidth} = this.instance;
                    const thumbnailWidth = 320;
                    this.manager.createThumbnail(thumbnailWidth, (screenHeight / screenWidth) * thumbnailWidth)
                        .then((blob) => {
                            if (blob) {
                                this.createChecksumForThumbnail(blob).then((checksum) => {
                                    if (checksum !== this.thumbnailChecksum) {
                                        //this._desktopConnection.emit('thumbnail', blob);
                                        this.thumbnailChecksum = checksum;
                                    }
                                });
                            }
                        });
                }
            });
        }
    }

    private handleWindowFocus(event: FocusEvent): void {
        if (event.target === window) {
            this.readAsyncClipboard();
        }
    }

    private bindWindowListeners(): void {
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
    }

    private unbindWindowListeners(): void {
        window.removeEventListener('focus', this.handleWindowFocus.bind(this));
    }

    private handleClipboardData(): void {
        this.readAsyncClipboard();
        this.configurationService.load()
            .pipe(takeUntil(this._destroy$))
            .subscribe((configuration) => {
                const isValidUri = (url) => {
                    const pattern = new RegExp('^((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})' + // domain name
                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
                    return !!pattern.test(url);
                };

                const getHostForUri = (url: string) => {
                    const allowedHosts = configuration.desktop.allowedClipboardUrlHosts;
                    for (const host of allowedHosts) {
                        if (url.startsWith(host.host)) {
                            return host;
                        }
                    }
                    return null;
                };

                const getClipboardUrl = (data) => {
                    if (data.startsWith('visa://')) {
                        const url = data.substring(7);
                        if (isValidUri(url)) {
                            const host = getHostForUri(url);
                            if (host) {
                                return `${host.https ? 'https' : 'http'}://${url}`;
                            }
                        }
                    }
                    return null;
                };

                this.clipboard$ = this.manager.onRemoteClipboardData.pipe(
                    filter(data => data.event === 'received'),
                    map(data => data.content)
                ).subscribe(data => {
                    const url = getClipboardUrl(data);
                    if (url == null) {
                        // this.sendAsyncClipboard(data);
                    } else {
                        this.createUrlDialog(url);
                    }
                });
            });
    }

    private sendAsyncClipboard(): void {
        // const options = {name: 'clipboard-write', allowWithoutGesture: false};
        // // @ts-ignore
        // navigator.permissions.query(options).then(result => {
        //     if (result.state === 'granted' || result.state === 'prompt') {
        //         // @ts-ignore
        //         navigator.clipboard.writeText(data);
        //     }
        // });
    }

    private createUrlDialog(url: string): void {
        const dialog = this.dialog.open(UrlComponent, {
            height: 'auto',
            width: '600px',
            data: {
                url
            },
        });
        dialog.afterClosed()
            .pipe(
                finalize(() => this.manager.setFocused(true)),
                filter(confirm => confirm === true)
            )
            .subscribe(() => window.open(url));
    }

    /**
     * Update the connection stats when a new tunnel instruction is received from the remote desktop
     */
    private handleTunnelInstructionMessages(): void {
        let messages: {size: number, time: number}[] = [];

        this.dataReceivedMessages$ = combineLatest([
            this.manager.onDataReceived
                .pipe(
                    share(),
                    filter(data => data != null),
                    map(data => data.length),
                    scan((ms, total) => {
                        if (this.manager.isConnected()) {
                            messages.push({size: total, time: Date.now()});
                            return total + ms;
                        } else {
                            return 0;
                        }
                    }, 0),
                    startWith(0),
                ),
            interval(1000)
                .pipe(
                    share(),
                    timeInterval(),
                    map((x) => x.interval),
                    scan((ms, total) => {
                        if (this.manager.isConnected()) {
                            return total + ms;
                        }
                        return 0;
                    }, 0),
                    startWith(0),
                )])
            .subscribe(([dataReceived , timeElapsed]) => {
                const now = Date.now();
                messages = messages.filter(message => now - message.time <= 1000);
                const bytesPerSecond = messages.map(message => message.size).reduce((a, b) => a + b, 0);
                this.totalDataReceived$.next(dataReceived);
                this.dataReceivedRate$.next(bytesPerSecond);
                this.timeElapsed$.next(timeElapsed);
            });
    }

    private handleDesktopEvent(event: string, data?: any): void {
        console.log(event);
        if (event === 'connected') {
            // Start the desktop streaming
            if (this.manager == null) {
                this.createManager();
            }
            this.createAuthenticationTicket().subscribe(ticket => {
                const connectionId = data as string;
                this.manager.connect({token: ticket, protocol: this._useWebX ? 'webx' : 'guacamole', connectionId});
                this.bindManagerHandlers();
            })

        } else if (event === 'users:connected') {
            this.users$.next(data);

        } else if (event === 'user:connected') {
            this.notifierService.notify('success', `${data.fullName} has connected to the instance`);

        } else if (event === 'user:disconnected') {
            this.notifierService.notify('success', `${data.fullName} has disconnected from the instance`);

        } else if (event === 'owner:away') {
            this.ownerNotConnected = true;

        } else if (event === 'room:locked') {
            this.unlockedRole = this.instance.membership.role;
            if (this.instance.membership.role === 'USER') {
                this.notifierService.notify('warning', `The instance owner, ${this.instance.owner.fullName}, is no longer connected. All connections are now read-only.`);
                this.instance.membership.role = 'GUEST';

            } else {
                this.notifierService.notify('warning', `The instance owner, ${this.instance.owner.fullName}, is no longer connected.`);
            }

        } else if (event === 'room:unlocked') {
            if (this.unlockedRole === 'USER') {
                this.notifierService.notify('success', `The instance owner, ${this.instance.owner.fullName}, is now connected. You have full control of this instance.`);
                this.instance.membership.role = this.unlockedRole;
                this.unlockedRole = null;

            } else {
                this.notifierService.notify('success', `The instance owner, ${this.instance.owner.fullName}, is now connected.`);
            }

        } else if (event === 'access:denied') {
            this.error = 'You have not been given access to this instance';

        } else if (event === 'access:pending') {
            this.accessPending = true;

        } else if (event === 'access:request') {
            const dialogId = 'access-request-dialog-' + data.token;
            this.createAccessRequestDialog(dialogId, data.userFullName, (response: string) => {
                this._desktopConnection.emit('access:reply', {id: data.token, response});
            });

        } else if (event === 'access:cancel') {
            const dialogId = 'access-request-dialog-' + data.token;
            const dialog = this.dialog.getDialogById(dialogId);
            if (dialog) {
                dialog.close();
                this.notifierService.notify('success', `${data.userFullName} has cancelled their request to access your instance`);
            }

        } else if (event === 'access:granted') {
            const grant = data === 'GUEST' ? 'read-only' : (data === 'USER' || data === 'SUPPORT') ? 'full' : '';
            this.instance.membership.role = data;
            this.notifierService.notify('success', `${this.instance.owner.fullName} has granted you ${grant} access to the instance`);

            this.accessPending = true;

        } else if (event === 'access:revoked') {
            this.accessRevoked = true;
        }
    }

    /**
     * Handle any socket messages received
     */
    private handleSocketMessages(): void {
        console.log('TODO: handleSocketMessages');
        // let tunnel;
        // if (this._useWebX) {
        //     tunnel = (this.manager as WebXVirtualDesktopManager).getTunnel() as WebXSocketIOTunnel;
        //
        // } else {
        //     tunnel = (this.manager as GuacamoleVirtualDesktopManager).getTunnel() as SocketIOTunnel;
        // }
        // const socket = tunnel.getSocket();
        // socket.on('disconnect', () => {
        //     this.closeAllDialogs();
        // });
        // socket.on('users:connected', (data) => {
        //     this.users$.next(data);
        // });
        // socket.on('user:connected', (data) => {
        //     this.notifierService.notify('success', `${data.fullName} has connected to the instance`);
        // });
        // socket.on('user:disconnected', (data) => {
        //     this.notifierService.notify('success', `${data.fullName} has disconnected from the instance`);
        // });
        // socket.on('owner:away', () => {
        //     this.ownerNotConnected = true;
        // });
        // socket.on('room:locked', () => {
        //     this.unlockedRole = this.instance.membership.role;
        //     if (this.instance.membership.role === 'USER') {
        //         // tslint:disable-next-line:max-line-length
        //         this.notifierService.notify('warning', `The instance owner, ${this.instance.owner.fullName}, is no longer connected. All connections are now read-only.`);
        //         this.instance.membership.role = 'GUEST';
        //
        //     } else {
        //         this.notifierService.notify('warning', `The instance owner, ${this.instance.owner.fullName}, is no longer connected.`);
        //     }
        // });
        // socket.on('room:unlocked', () => {
        //     if (this.unlockedRole === 'USER') {
        //         // tslint:disable-next-line:max-line-length
        //         this.notifierService.notify('success', `The instance owner, ${this.instance.owner.fullName}, is now connected. You have full control of this instance.`);
        //         this.instance.membership.role = this.unlockedRole;
        //         this.unlockedRole = null;
        //
        //     } else {
        //         this.notifierService.notify('success', `The instance owner, ${this.instance.owner.fullName}, is now connected.`);
        //     }
        // });
        // socket.on('access:denied', () => {
        //     this.error = 'You have not been given access to this instance';
        // });
        // socket.on('access:pending', () => {
        //     this.accessPending = true;
        // });
        // socket.on('access:request', (data) => {
        //     const dialogId = 'access-request-dialog-' + data.token;
        //     this.createAccessRequestDialog(dialogId, data.userFullName, (response: string) => {
        //         socket.emit('access:reply', {id: data.token, response});
        //     });
        // });
        // socket.on('access:cancel', (data) => {
        //     const dialogId = 'access-request-dialog-' + data.token;
        //     const dialog = this.dialog.getDialogById(dialogId);
        //     if (dialog) {
        //         dialog.close();
        //         this.notifierService.notify('success', `${data.userFullName} has cancelled their request to access your instance`);
        //     }
        // });
        // socket.on('access:granted', (data) => {
        //     const grant = data === 'GUEST' ? 'read-only' : (data === 'USER' || data === 'SUPPORT') ? 'full' : '';
        //     this.instance.membership.role = data;
        //     this.notifierService.notify('success', `${this.instance.owner.fullName} has granted you ${grant} access to the instance`);
        //
        //     this.accessPending = true;
        // });
        // socket.on('access:revoked', () => {
        //     this.accessRevoked = true;
        // });
        //
        // if (this.instance.membership.isRole('OWNER', 'SUPPORT')) {
        //     // take a screenshot every minute
        //     this.thumbnailInterval$ = timer(10000, 60000).subscribe(() => {
        //         if (this.manager.isConnected()) {
        //             const {screenHeight, screenWidth} = this.instance;
        //             const thumbnailWidth = 320;
        //             this.manager.createThumbnail(thumbnailWidth, (screenHeight / screenWidth) * thumbnailWidth)
        //                 .then((blob) => {
        //                     if (blob) {
        //                         this.createChecksumForThumbnail(blob).then((checksum) => {
        //                             if (checksum !== this.thumbnailChecksum) {
        //                                 socket.emit('thumbnail', blob);
        //                                 this.thumbnailChecksum = checksum;
        //                             }
        //                         });
        //                     }
        //                 });
        //         }
        //     });
        // }
        //
        // document.body.addEventListener('offline', () => {
        //     socket.disconnect();
        // }, false);
    }

    private createChecksumForThumbnail(blob: Blob): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsBinaryString(blob);
            reader.onloadend = () => {
                const hash = md5((reader.result as string)).toString();
                resolve(hash);
            };
        });
    }

    private handleSendRemoteClipboardData(text: string): void {
        if (text) {
            // this.notifierService.notify('success', 'Sent clipboard data to instance');
            this.manager.sendRemoteClipboardData(text);
        }
    }

    /**
     * Create all of the hot keys
     */
    private createAndBindHotkeys(): void {
        this.createKeyboardHotkey();
        this.createClipboardHotKey();
        this.createSettingsHotkey();
        this.createFullScreenHotkey();
        this.bindHotkeys();
    }

    /**
     * Bind all of the hot keys to the hotkey service
     */
    private bindHotkeys(): void {
        this.hotkeys.forEach((hotkey) => this.hotkeysService.add(hotkey));
    }

    /**
     * Unbind all of the hot keys from the hotkey service
     */
    private unbindHotkeys(): void {
        this.hotkeys.forEach((hotkey) => this.hotkeysService.remove(hotkey));
    }

    /**
     * Associate a keyboard hot key to open and close the keyboard dialog
     */
    private createKeyboardHotkey(): void {
        this.hotkeys.push(new Hotkey('ctrl+shift+alt+k', (): boolean => {
            const id = 'keyboard-dialog';
            if (this.isDialogOpen(id)) {
                this.removeDialog(id);
            } else {
                this.createKeyboardDialog();
            }
            return false; // Prevent bubbling
        }));
    }

    private readAsyncClipboard(): void {
        // @ts-ignore
        // navigator.permissions.query({name: 'clipboard-read', allowWithoutGesture: false}).then(result => {
        //     if (result.state === 'granted' || result.state === 'prompt') {
        //         // @ts-ignore
        //         navigator.clipboard.readText().then(data => {
        //             this.handleSendRemoteClipboardData(data);
        //         });
        //     }
        // });
    }

    /**
     * Associate a hot key to open and close the clipboard dialog
     */
    private createClipboardHotKey(): void {
        this.hotkeys.push(new Hotkey('ctrl+shift+alt+c', (): boolean => {
            const id = 'clipboard-dialog';
            if (this.isDialogOpen(id)) {
                this.removeDialog(id);
            } else {
                this.createClipboardDialog();
            }
            return false; // Prevent bubbling
        }));
    }

    /**
     * Associate a hot key to enter into full screen
     */
    private createFullScreenHotkey(): void {
        this.hotkeys.push(new Hotkey('ctrl+shift+alt+f', (): boolean => {
            this.handleEnterFullScreen();
            return false; // Prevent bubbling
        }));
    }

    /**
     * Associate a hot key to open and close the settings dialog
     */
    private createSettingsHotkey(): void {
        this.hotkeys.push(new Hotkey('ctrl+shift+alt+s', (): boolean => {
            const id = 'settings-dialog';
            if (this.isDialogOpen(id)) {
                this.removeDialog(id);
            } else {
                this.createSettingsDialog();
            }
            return false; // Prevent bubbling
        }));
    }

    private createDialog(component, id: string): MatDialogRef<any> {
        return this.dialog.open(component, {
            height: 'auto',
            id,
            width: '850px',
            panelClass: 'mat-dialog-container-semi-transparent',
            hasBackdrop: true,
            data: {
                manager: this.manager,
            },
        });
    }

    private removeDialog(id: string): void {
        const dialog = this.dialog.getDialogById(id);
        if (dialog) {
            dialog.close();
        }
        this.manager.setFocused(true);
    }


    private createMembersConnectedDialog(): void {
        this.dialog.open(MembersConnectedComponent, {
            height: 'auto',
            id: 'members-connected-dialog',
            width: '450px',
            data: {
                instance: this.instance,
                manager: this.manager,
                users$: this.users$,
                user: this.user,
                useWebX: this._useWebX
            },
        });
    }

    private createKeyboardDialog(): void {
        if (!this.manager.isConnected()) {
            return;
        }
        this.dialog.open(KeyboardComponent, {
            id: 'keyboard-dialog',
            height: 'auto',
            width: '750px',
            panelClass: 'mat-dialog-container-semi-transparent',
            data: {
                manager: this.manager,
            },
            hasBackdrop: false,
        });
    }

    private createClipboardDialog(): void {
        if (!this.manager.isConnected()) {
            return;
        }
        this.manager.setFocused(false);
        const dialog = this.createDialog(ClipboardComponent, 'clipboard-dialog');
        dialog.afterClosed()
            .pipe(
                finalize(() => this.manager.setFocused(true)),
                filter((text) => text != null),
            )
            .subscribe((text) => this.handleSendRemoteClipboardData(text.toString()));
    }

    private createSettingsDialog(): void {
        this.manager.setFocused(false);
        const dialog = this.dialog.open(SettingsComponent, {
            id: 'settings-dialog',
            width: '450px',
            data: {
                timeElapsed$: this.timeElapsed$,
                totalDataReceived$: this.totalDataReceived$,
                dataReceivedRate$: this.dataReceivedRate$
            },
        });
        dialog.afterClosed().subscribe(() => this.manager.setFocused(true));
    }

    private createAccessRequestDialog(dialogId: string, userFullName: string, callback: (response: string) => void): void {
        this.dialog.open(AccessRequestComponent, {
            id: dialogId,
            height: 'auto',
            data: {
                userFullName,
                callback,
            },
            hasBackdrop: true,
        });
    }

    private createFileManagerDialog(): void {
        this.manager?.setFocused(false);
        const dialog = this.dialog.open(FileManagerComponent, {
            id: 'file-manager-dialog',
            height: 'auto',
            width: '850px',
            hasBackdrop: true,
            data: {
                context: {
                    basePath: `${environment.paths.visafs}/${this.instance.id}`,
                    accessToken: this.instance.computeId,
                }
            },
        });
        dialog.afterClosed().subscribe(() => this.manager.setFocused(true));
    }

    private isDialogOpen(id: string): boolean {
        const dialog = this.dialog.getDialogById(id);
        return (dialog !== undefined);
    }

    private closeAllDialogs(): void {
        this.dialog.closeAll();
    }

}
