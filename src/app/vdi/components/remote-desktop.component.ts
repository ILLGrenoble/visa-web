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
import {WaitingMessageComponent} from "./messages/waiting-message.component";
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
                    <ng-content select='ngx-remote-desktop-toolbar-item[toolbarPosition=left]'></ng-content>
                </ul>
                <ul class="ngx-remote-desktop-toolbar-items">
                    <ng-content select='ngx-remote-desktop-toolbar-item[toolbarPosition=right]'></ng-content>
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

                <!-- Waiting message -->
                <div *ngIf="(state|async) === states.WAITING">
                    <div class="ngx-remote-desktop-message" *ngIf="waitingMessage">
                        <ng-content select="ngx-remote-desktop-waiting-message"></ng-content>
                    </div>
                    <ngx-remote-desktop-message *ngIf="!waitingMessage"
                                                title="Waiting for the remote desktop"
                                                message="Connection to the server established. Waiting for the remote desktop to start..."
                                                type="success">
                    </ngx-remote-desktop-message>
                </div>
                <!-- End waiting message -->

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
                        <ng-content select='ngx-remote-desktop-status-bar-item[toolbarPosition=left]'></ng-content>
                    </div>
                    <div class="ngx-remote-desktop-status-bar-items">
                        <ng-content select='ngx-remote-desktop-status-bar-item[toolbarPosition=right]'></ng-content>
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
            state('1', style({
                transform: 'translateX(0%)',
                opacity: 1,
                'pointer-events': 'all'
            })),
            state('0', style({
                transform: 'translateX(calc(-100% + 10px))',
                opacity: 0.5,
                'pointer-events': 'none',
            })),
            transition('1 => 0', animate('100ms 200ms ease-out')),
            transition('0 => 1', animate('100ms ease-out')),
        ]),
    ],
})
export class RemoteDesktopComponent {

    private _manager: VirtualDesktopManager;

    /**
     * Client that manages the connection to the remote desktop
     */
    @Input()
    public set manager(manager: VirtualDesktopManager) {
        if (this._manager != null) {
            this.unbindSubscriptions();
        }
        this._manager = manager;
        this.state.next(this.states.CONNECTING);
        this.bindSubscriptions();
    }

    get manager(): VirtualDesktopManager {
        return this._manager;
    }

    /**
     * Guacamole has more states than the list below however for the component we are only interested
     * in managing four states.
     */
    public states = {
        CONNECTING: 'CONNECTING',
        WAITING: 'WAITING',
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

    @ContentChild(WaitingMessageComponent)
    public waitingMessage: WaitingMessageComponent;

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
     * Timer for showing toolbar in fullscreen
     */
    private hoverOverToolbarAreaTimer: number = null;

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
            case VirtualDesktopManager.STATE.WAITING:
                this.setState(this.states.WAITING);
                break;
            case VirtualDesktopManager.STATE.CONNECTING:
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
        if (this.hoverOverToolbarAreaTimer) {
            window.clearTimeout(this.hoverOverToolbarAreaTimer);
        }
        this.handleToolbar();
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

    /**
     * Hide or show toolbar
     */
    private handleToolbar(): void {
        this.toolbarVisible = (!this.manager.isFullScreen());
    }

    /**
     * Clear the timer for showing the toolbar in fullscreen
     */
    private clearHoverOverToolbarAreaTimeout(): void {
        if (this.hoverOverToolbarAreaTimer != null) {
            window.clearTimeout(this.hoverOverToolbarAreaTimer);
            this.hoverOverToolbarAreaTimer = null;
        }
    }

    /**
     * Restart the timer for showing the toolbar in fullscreen
     */
    private restartHoverOverToolbarAreaTimeout(): void {
        this.clearHoverOverToolbarAreaTimeout();
        this.hoverOverToolbarAreaTimer = window.setTimeout(() => {
            this.toolbarVisible = true;
            this.hoverOverToolbarAreaTimer = null;

        }, 500);
    }

    /**
     * Handle the display mouse movement
     */
    handleDisplayMouseMove($event: any): void {
        if (!this.manager.isFullScreen()) {
            return;
        }
        const toolbarWidth = this.toolbar.nativeElement.clientWidth;
        const x = $event.x;
        if (x >= 0 && x <= 10) {
            this.restartHoverOverToolbarAreaTimeout();
        }

        if ((x >= toolbarWidth && this.toolbarVisible == true) || (x > 10 && this.toolbarVisible == false)) {
            this.toolbarVisible = false;
            this.clearHoverOverToolbarAreaTimeout();
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
