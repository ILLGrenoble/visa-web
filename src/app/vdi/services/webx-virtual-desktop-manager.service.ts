import {VirtualDesktopManager} from './virtual-desktop-manager.service';
import {WebXClientAdapter } from './webx-virtual-desktop-adapters';
import {BehaviorSubject, Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {WebXClient, WebXDisplay, WebXStatsHandler, WebXTunnel} from '@illgrenoble/webx-client';

class StatsHandler extends WebXStatsHandler {

    private readonly _dataReceived$ = new BehaviorSubject<number>(null);

    get dataReceived$(): BehaviorSubject<number> {
        return this._dataReceived$;
    }

    constructor() {
        super();
    }

    handle(stats: { received: number; sent: number }): void {
        if (stats.received) {
            this._dataReceived$.next(stats.received);
        }
    }

    destroy(): void {
        // todo
    }
}

export class WebXVirtualDesktopManager extends VirtualDesktopManager {

    private readonly _statsHandler = new StatsHandler();
    private readonly _statsInterrupt$: Subject<boolean> = new Subject<boolean>();

    private readonly _client: WebXClient;

    private readonly _resizeHandler = this._handleResize.bind(this);
    private readonly _blurHandler = this._handleBlur.bind(this);
    private readonly _visibilityChangeHandler = this._handleVisibilityChange.bind(this);

    private readonly _connectHandler = this._onConnected.bind(this);
    private readonly _disconnectedHandler = this._onDisconnected.bind(this);

    constructor(tunnel: WebXTunnel) {
        super();
        this._client = new WebXClient(tunnel);

        this.setClientAdapter(new WebXClientAdapter(this._client));

        // Data handlers to measure data rate
    }

    /**
     * Get the webx tunnel
     */
    public getTunnel(): WebXTunnel {
        return this._client.tunnel;
    }

    connect(parameters: any): void {
        this.setState(VirtualDesktopManager.STATE.CONNECTING);

        this._client.connect(this._disconnectedHandler, parameters)
            .then(this._connectHandler)
            .catch(error => {
                console.error(error.message);
                this._onDisconnected();
            });

    }

    disconnect(): void {
        this._client.disconnect();
    }

    async createScreenshot(): Promise<Blob> {
        // todo
        console.log('createScreenshot not implemented for WebX Virtual Desktop Manager');
        return null;
    }

    async createThumbnail(width: number, height: number): Promise<Blob> {
        // todo
        console.log('createThumbnail not implemented for WebX Virtual Desktop Manager');
        return null;
    }

    sendRemoteClipboardData(text: string): void {
        // todo
        throw new Error('sendRemoteClipboardData not implemented for WebX Virtual Desktop Manager');
    }



    private _onConnected(): void {
        this.setState(VirtualDesktopManager.STATE.WAITING);

        const container = this.getClient().getDisplay().getElement();

        this._client.initialise(container)
            .then((display: WebXDisplay) => {
                // Start animating the display once everything has been initialised
                display.animate();

                display.resize();
                this._bindListeners();

                this.setState(VirtualDesktopManager.STATE.CONNECTED);

            })
            .catch(err => {
                console.error(err.message);
                this._onDisconnected();
            });
    }

    private _onDisconnected(): void {
        this._unbindListeners();

        this.setState(VirtualDesktopManager.STATE.DISCONNECTED);

        if (this._client) {
            this._client.disconnect();
        }
    }

    private _bindListeners(): void {
        this._statsHandler.dataReceived$.pipe(
            takeUntil(this._statsInterrupt$),
            filter(data => data != null),
            map(data => ({length: data})))
            .subscribe(this.onDataReceived);

        this._client.registerTracer('stats', this._statsHandler);

        window.addEventListener('resize', this._resizeHandler);
        window.addEventListener('blur', this._blurHandler);
        document.addEventListener('visibilitychange', this._visibilityChangeHandler);
    }

    private _unbindListeners(): void {

        this._statsInterrupt$.next(true);
        this._client.unregisterTracer('stats');

        window.removeEventListener('resize', this._resizeHandler);
        window.removeEventListener('blur', this._blurHandler);
        document.removeEventListener('visibilitychange', this._visibilityChangeHandler);
    }

    private _handleResize(): void {
        this._client.resizeDisplay();
    }

    private _handleBlur(): void {
        this._client.resetInputs();
    }

    private _handleVisibilityChange(): void {
        this._client.resetInputs();
    }
}
