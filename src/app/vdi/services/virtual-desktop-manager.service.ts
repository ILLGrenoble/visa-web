import {BehaviorSubject, ReplaySubject, Subject} from 'rxjs';
import {ClientAdapter} from './virtual-desktop-adapters';

export enum ScaleMode {
    Scaled,
    Unscaled,
    Optimal
}

export interface ConnectionParameters {
    token?: string,
    protocol?: string,
}
/**
 * Manages the connection to the remote desktop
 */
export abstract class VirtualDesktopManager {

    public static STATE = {
        /**
         * The machine connection has not yet been attempted.
         */
        IDLE: 'IDLE',

        /**
         * The machine connection is being established.
         */
        CONNECTING: 'CONNECTING',

        /**
         * The machine connection has been successfully established, and the
         * client is now waiting for receipt of initial graphical data.
         */
        WAITING: 'WAITING',

        /**
         * The Guacamole connection has been successfully established, and
         * initial graphical data has been received.
         */
        CONNECTED: 'CONNECTED',

        /**
         * The machine connection has terminated successfully. No errors are
         * indicated.
         */
        DISCONNECTED: 'DISCONNECTED',

        /**
         * The machine connection has terminated due to an error reported by
         * the client. The associated error code is stored in statusCode.
         *
         */
        CLIENT_ERROR: 'CLIENT_ERROR',

        /**
         * The machine connection has terminated due to an error reported by
         * the tunnel. The associated error code is stored in statusCode.
         */
        TUNNEL_ERROR: 'TUNNEL_ERROR'
    };

    private _clientAdapter: ClientAdapter;

    /**
     * When data is received from the tunnel
     */
    public onDataReceived = new BehaviorSubject<{ length: number }>(null);

    /**
     * Remote desktop connection state observable
     * Subscribe to this if you want to be notified when the connection state changes
     */
    public onStateChange = new BehaviorSubject(VirtualDesktopManager.STATE.IDLE);

    /**
     * Remote desktop clipboard observable.
     * Subscribe to this if you want to be notified if text has been cut/copied within
     * the remote desktop.
     */
    public onRemoteClipboardData = new ReplaySubject<{ content: string, event: string }>(1);

    public onKeyboardReset = new BehaviorSubject<boolean>(true);

    public onFocused = new BehaviorSubject<boolean>(true);

    public scaleMode = new BehaviorSubject<ScaleMode>(ScaleMode.Scaled);

    public onFullScreen = new BehaviorSubject<boolean>(false);

    public onReconnect = new Subject<boolean>();


    protected setClientAdapter(clientAdapter: ClientAdapter): void {
        this._clientAdapter = clientAdapter;
    }

    public getClient(): ClientAdapter {
        return this._clientAdapter;
    }

    /**
     * Get the guacamole connection state
     */
    public getState(): string {
        return this.onStateChange.getValue();
    }

    /**
     * Check to see if the given state equals the current state
     */
    public isState(state: string): boolean {
        return state === this.onStateChange.getValue();
    }

    /**
     * Set the display focus
     */
    public setFocused(newFocused: boolean): void {
        this.onFocused.next(newFocused);
    }

    /**
     * Set scaled mode
     */
    public setScaleMode(scaleMode: ScaleMode): void {
        this.scaleMode.next(scaleMode);
    }

    /**
     * Get the display scale mode
     */
    public getScaleMode(): ScaleMode {
        return this.scaleMode.getValue();
    }

    /**
     * Set full screen
     */
    public setFullScreen(newFullScreen: boolean): void {
        this.onFullScreen.next(newFullScreen);
    }

    /**
     * Is the display full screen?
     */
    public isFullScreen(): boolean {
        return this.onFullScreen.getValue();
    }


    /**
     * Is the tunnel connected?
     */
    public isConnected(): boolean {
        return this.onStateChange.getValue() === VirtualDesktopManager.STATE.CONNECTED;
    }

    /**
     * Reset the keyboard
     * This will release all keys
     */
    public resetKeyboard(): void {
        this.onKeyboardReset.next(true);
    }

    /**
     * Set the connection state and emit the new state to any subscribers
     * @param state Connection state
     */
    protected setState(state: string): void {
        this.onStateChange.next(state);
    }

    /**
     * Disconnect from the remote desktop
     */
    public abstract disconnect(): void;

    /**
     * Connect to the remote desktop
     */
    public abstract connect(parameters: ConnectionParameters): void;

    /**
     * Generate a thumbnail
     */
    public abstract createThumbnail(width: number, height: number): Promise<Blob>;

    /**
     * Generate a screenshot
     */
    public abstract createScreenshot(): Promise<Blob>;

    /**
     * Send text to the remote clipboard
     */
    public abstract sendRemoteClipboardData(text: string): void;
}
