import {ConnectionParameters, VirtualDesktopManager} from './virtual-desktop-manager.service';
import {WebXClientAdapter } from './webx-virtual-desktop-adapters';
import {BehaviorSubject, Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {WebXClient, WebXDisplay, WebXStatsHandler, WebXTunnel, WebXMessage, WebXScreenInstruction, WebXScreenMessage, WebXConnectionStatus} from '@illgrenoble/webx-client';

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

    private _testing: boolean = false;
    private _connectionTest: Promise<WebXMessage> = null;

    constructor(tunnel: WebXTunnel) {
        super();
        this._client = new WebXClient(tunnel, {display: {backgroundColor: '#272a31'}});

        this.setClientAdapter(new WebXClientAdapter(this._client));
    }

    /**
     * Get the webx tunnel
     */
    public getTunnel(): WebXTunnel {
        return this._client.tunnel;
    }

    async startConnectionTesting(): Promise<void> {
        if (!this._testing) {
            this._testing = true;
            await this._doConnectionTest(this.getTunnel());
        }
    }

    async stopConnectionTesting(): Promise<void> {
        if (this._testing) {
            this._testing = false;
            if (this._connectionTest) {
                await this._connectionTest;
                this._connectionTest = null;
            }
        }
    }

    public isConnectionTestRunning(): boolean {
        return this._testing;
    }

    public isConnectionTestAvailable(): boolean {
        return true;
    }

    private async _doConnectionTest(tunnel: WebXTunnel): Promise<void> {
        if (this._testing) {
            setTimeout(() => this._doConnectionTest(tunnel), 1000);
        }

        const screenInstruction = new WebXScreenInstruction();

        const startTime = new Date();
        this._connectionTest = tunnel.sendRequest(screenInstruction);
        try {
            const response = await this._connectionTest as WebXScreenMessage;
            this._connectionTest = null;
            const endTime = new Date();

            const latency = endTime.getTime() - startTime.getTime();
            console.log(`${startTime.toISOString()}: Latency: ${latency} ms ${latency > 5000 ? '❗❗❗' : latency > 1000 ? '❗' : latency > 500 ? '⚠️' : ''}`);

        } catch (e) {
            this._connectionTest = null;
            const endTime = new Date();

            const latency = endTime.getTime() - startTime.getTime();
            console.log(`${startTime.toISOString()}: Latency: ${latency} ms: Failed to get response (${e.message})`);
        }

    }

    connect(parameters: ConnectionParameters): void {
        this.setState(VirtualDesktopManager.STATE.CONNECTING);

        this._client.connect(this._disconnectedHandler, parameters)
            .then(this._connectHandler)
            .catch(error => {
                console.error(error.message);
                this._onDisconnected();
            });

    }

    disconnect(): void {
        super.disconnect();
        this._client.disconnect();
    }

    async createScreenshot(type: string, quality: number): Promise<Blob> {
        return this._client.createScreenshot(type, quality);
    }

    async createThumbnail(width: number, height: number): Promise<Blob> {
        const screenshotBlob = await this.createScreenshot('image/png', 1.0);
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(screenshotBlob);
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    resolve(blob);
                    URL.revokeObjectURL(url);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    sendRemoteClipboardData(text: string): void {
        this._client.sendClipboardContent(text);
        this.onRemoteClipboardData.next({ content: text, event: 'sent'});
    }

    private _onConnected(): void {
        this.setState(VirtualDesktopManager.STATE.CONNECTING);

        const container = this.getClient().getDisplay().getElement();

        this._client.initialise(container, {useDefaultMouseAdapter: false, useDefaultKeyboardAdapter: false, waitForConnectionWithTimeout: 20000, connectionStatusCallback: (status: WebXConnectionStatus) => {
                if (status === WebXConnectionStatus.STARTING) {
                    this.setState(VirtualDesktopManager.STATE.WAITING);
                }
            }})
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
        this._client.clipboardHandler = (clipboardContent: string) => {
            this.onRemoteClipboardData.next({ content: clipboardContent, event: 'received'});
        };

        window.addEventListener('resize', this._resizeHandler);
        window.addEventListener('blur', this._blurHandler);
        document.addEventListener('visibilitychange', this._visibilityChangeHandler);
    }

    private _unbindListeners(): void {

        this._statsInterrupt$.next(true);
        this._client.unregisterTracer('stats');
        this._client.clipboardHandler = (clipboardContent: string) => {};

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
