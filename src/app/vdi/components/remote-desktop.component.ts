import {animate, state, style, transition, trigger} from '@angular/animations';
import {
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';

import {VirtualDesktopManager} from '../services';
import {ConnectingMessageComponent} from './messages/connecting-message.component';
import {DisconnectedMessageComponent} from './messages/disconnected-message.component';
import {ErrorMessageComponent} from './messages/error-message.component';
import screenfull from 'screenfull';

/**
 * The main component for displaying a remote desktop
 */
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'ngx-remote-desktop',
    template: `
        <main class="ngx-remote-desktop" [ngClass]="{'ngx-remote-desktop-fullscreen': manager.isFullScreen() }" #container>
            <!-- Toolbar items template -->
            <ng-template #toolbarItems>
                <ul class="ngx-remote-desktop-toolbar-items">
                    <ng-content select='ngx-remote-desktop-toolbar-item[align=left]'></ng-content>
                </ul>
                <ul class="ngx-remote-desktop-toolbar-items">
                    <ng-content select='ngx-remote-desktop-toolbar-item[align=right]'></ng-content>
                </ul>
            </ng-template>
            <!-- End toolbar items template -->
            <!-- Normal toolbar -->
            <nav class="ngx-remote-desktop-toolbar" *ngIf="!manager.isFullScreen()" [hidden]="!manager.isConnected()">
                <template [ngTemplateOutlet]="toolbarItems"></template>
            </nav>
            <!-- End normal toolbar -->
            <!-- Full screen toolbar -->
            <nav class="ngx-remote-desktop-toolbar ngx-remote-desktop-toolbar-fullscreen"  [hidden]="!manager.isConnected()" (click)="handleToolbarClicked()" *ngIf="manager.isFullScreen()"
                 [@toolbarAnimation]="toolbarVisible" #toolbar>
                <template [ngTemplateOutlet]="toolbarItems"></template>
            </nav>
            <!-- End full screen toolbar -->
            <section class="ngx-remote-desktop-container"     (swiperight)="onSwipeRight($event)">
                <!-- Connecting message -->
                <div *ngIf="(state|async) === states.CONNECTING">
                    <div class="ngx-remote-desktop-message" *ngIf="connectingMessage">
                        <ng-content select="ngx-remote-desktop-connecting-message"></ng-content>
                    </div>
                    <ngx-remote-desktop-message *ngIf="!connectingMessage"
                                                title="Connecting to remote desktop"
                                                message="Attempting to connect to the remote desktop. Waiting for response..."
                                                type="success">
                    </ngx-remote-desktop-message>
                </div>
                <!-- End connecting message -->

                <!-- Disconnected message -->
                <div *ngIf="(state|async) === states.DISCONNECTED">
                    <div class="ngx-remote-desktop-message" *ngIf="disconnectedMessage">
                        <ng-content select="ngx-remote-desktop-disconnected-message"></ng-content>
                    </div>
                    <ngx-remote-desktop-message *ngIf="!disconnectedMessage"
                                                title="Disconnected"
                                                message="The connection to the remote desktop terminated successfully"
                                                type="error">
                        <button (click)="manager.onReconnect.next(true)" class="ngx-remote-desktop-message-body-btn">
                            Reconnect
                        </button>
                    </ngx-remote-desktop-message>
                </div>
                <!-- End disconnected message -->

                <!-- Error message -->
                <div *ngIf="(state|async) === states.ERROR">
                    <div class="ngx-remote-desktop-message" *ngIf="errorMessage">
                        <ng-content select="ngx-remote-desktop-error-message"></ng-content>
                    </div>

                    <ngx-remote-desktop-message *ngIf="!errorMessage"
                                                title="Connection error"
                                                message="The remote desktop server is currently unreachable."
                                                type="error">
                        <button (click)="manager.onReconnect.next(true)" class="ngx-remote-desktop-message-body-btn">
                            Connect
                        </button>
                    </ngx-remote-desktop-message>
                </div>
                <!-- End error message -->

                <!-- Display -->
                <ngx-remote-desktop-display *ngIf="(state|async) === states.CONNECTED"
                                            [manager]="manager"
                                            (mouseMove$)="handleDisplayMouseMove($event)">
                </ngx-remote-desktop-display>
                <!-- End display -->
            </section>
            <section [class.ngx-remote-desktop-status-bar-hidden]="manager.isFullScreen()">
                <!-- Status bar items template -->
                <ng-template #statusBarItems>
                    <div class="ngx-remote-desktop-status-bar-items">
                        <ng-content select='ngx-remote-desktop-status-bar-item[align=left]'></ng-content>
                    </div>
                    <div class="ngx-remote-desktop-status-bar-items">
                        <ng-content select='ngx-remote-desktop-status-bar-item[align=right]'></ng-content>
                    </div>
                </ng-template>
                <!-- End status bar items template -->
                <!-- status bar -->
                <div class="ngx-remote-desktop-status-bar" [hidden]="!manager.isConnected()">
                    <template [ngTemplateOutlet]="statusBarItems"></template>
                </div>
                <!-- End status bar -->
            </section>
        </main>
    `,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Default,
    styleUrls: ['./remote-desktop.component.scss'],
    animations: [
        trigger('toolbarAnimation', [
            state('1', style({transform: 'translateX(0%)'})),
            state('0', style({transform: 'translateX(-100%)'})),
            transition('1 => 0', animate('100ms 200ms ease-out')),
            transition('0 => 1', animate('100ms ease-out')),
        ]),
    ],
})
export class RemoteDesktopComponent implements OnInit, OnDestroy {
    /**
     * Client that manages the connection to the remote desktop
     */
    @Input()
    public manager: VirtualDesktopManager;

    /**
     * Guacamole has more states than the list below however for the component we are only interested
     * in managing four states.
     */
    public states = {
        CONNECTING: 'CONNECTING',
        CONNECTED: 'CONNECTED',
        DISCONNECTED: 'DISCONNECTED',
        ERROR: 'ERROR'
    };

    /**
     * Manage the component state
     */
    public state: BehaviorSubject<string> = new BehaviorSubject<string>(this.states.CONNECTING);

    @ContentChild(ConnectingMessageComponent)
    public connectingMessage: ConnectingMessageComponent;

    @ContentChild(DisconnectedMessageComponent)
    public disconnectedMessage: DisconnectedMessageComponent;

    @ContentChild(ErrorMessageComponent)
    public errorMessage: ErrorMessageComponent;

    @ViewChild('container')
    private container: ElementRef;

    @ViewChild('toolbar')
    private toolbar: ElementRef;

    /**
     * Subscriptions
     */
    private subscriptions: Subscription[] = [];

    /**
     * Hide or show the toolbar
     */
    public toolbarVisible = true;

    /**
     * Subscribe to the connection state  and full screen state when the component is initialised
     */
    ngOnInit(): void {
        this.bindSubscriptions();
    }

    /**
     * Remove all subscriptions when the component is destroyed
     */
    ngOnDestroy(): void {
        this.unbindSubscriptions();
    }

    /**
     * Bind the subscriptions
     */
    private bindSubscriptions(): void {
        this.subscriptions.push(this.manager.onStateChange.subscribe(this.handleState.bind(this)));
        this.subscriptions.push(this.manager.onFullScreen.subscribe(this.handleFullScreen.bind(this)));
    }

    /**
     * Unbind the subscriptions
     */
    private unbindSubscriptions(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    /**
     * Set the component state to the new guacamole state
     * @param newState the new state
     */
    private setState(newState: string): void {
        this.state.next(newState);
    }

    /**
     * Receive the state from the desktop client and update this components state
     * @param newState - state received from the guacamole client
     */
    private handleState(newState: string): void {
        switch (newState) {
            case VirtualDesktopManager.STATE.CONNECTED:
                this.setState(this.states.CONNECTED);
                break;
            case VirtualDesktopManager.STATE.DISCONNECTED:
                this.exitFullScreen();
                this.setState(this.states.DISCONNECTED);
                break;
            case VirtualDesktopManager.STATE.CONNECTING:
            case VirtualDesktopManager.STATE.WAITING:
                this.setState(this.states.CONNECTING);
                break;
            case VirtualDesktopManager.STATE.CLIENT_ERROR:
            case VirtualDesktopManager.STATE.TUNNEL_ERROR:
                this.exitFullScreen();
                this.setState(this.states.ERROR);
                break;
        }

    }

    /**
     * Exit full screen and show the toolbar
     */
    private exitFullScreen(): void {
        if (!screenfull.isFullscreen) {
            return;
        }
        screenfull.exit();
    }

    /**
     * Enter full screen mode and auto hide the toolbar
     */
    private enterFullScreen(): void {
        // @ts-ignore
        if ((screenfull as Screenfull).isFullscreen) {
            return;
        }
        const containerElement = this.container.nativeElement;
        // @ts-ignore
        (screenfull as Screenfull).request(containerElement);
        // @ts-ignore
        (screenfull as Screenfull).on('change', () => {
            // @ts-ignore
            if (!(screenfull as Screenfull).isFullscreen) {
                this.manager.setFullScreen(false);
            }
            this.handleToolbar();
        });
    }

    /**
     * Go in and out of full screen
     */
    private handleFullScreen(newFullScreen: boolean): void {
        if (newFullScreen) {
            this.enterFullScreen();
        } else {
            this.exitFullScreen();
        }
    }

    private handleToolbar(): void {
        this.toolbarVisible = (!this.manager.isFullScreen());
    }

    /**
     * Handle the display mouse movement
     */
    handleDisplayMouseMove($event: any): void {
        if (!this.manager.isFullScreen()) {
            return;
        }
        const toolbarWidth = this.toolbar.nativeElement.clientWidth;
        if ($event.x >= toolbarWidth) {
            this.toolbarVisible = false;
        }
    }

    @HostListener('document:mousemove', ['$event'])
    public onDocumentMousemove($event: MouseEvent): void {
        if (!this.manager.isFullScreen()) {
            return;
        }
        const toolbarWidth = this.toolbar.nativeElement.clientWidth;
        const x = $event.x;
        if (x >= -1 && x <= 0) {
            this.toolbarVisible = true;
        }
        if (x >= toolbarWidth) {
            this.toolbarVisible = false;
        }
    }

    public onSwipeRight(event: any): void {
        const endPoint = event.pointers[0].pageX;
        const distance = event.distance;
        const origin = endPoint - distance;
        const minimumXActivation = 15;
        if (origin <= minimumXActivation) {
            this.toolbarVisible = true;
        }
    }

    public handleToolbarClicked(): void {
        this.toolbarVisible = false;
    }


}
