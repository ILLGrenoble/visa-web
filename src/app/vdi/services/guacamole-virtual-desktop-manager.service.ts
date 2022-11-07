import { Client, StringReader, StringWriter, Tunnel } from '@illgrenoble/visa-guacamole-common-js';
import {BehaviorSubject} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import { VirtualDesktopManager } from './virtual-desktop-manager.service';
import {GuacamoleClientAdapter} from './guacamole-virtual-desktop-adapters';

/**
 * Manages the connection to the remote desktop
 */
export class GuacamoleVirtualDesktopManager extends VirtualDesktopManager {

    /**
     * When an instruction is received from the tunnel
     */
    private onTunnelInstruction = new BehaviorSubject<{ opcode: string, parameters: any }>(null);

    /**
     * The actual underlying remote desktop client
     */
    private readonly client: Client;

    /**
     * The tunnel being used by the underlying remote desktop client
     */
    private readonly tunnel: Tunnel;

    /**
     * Set up the manager
     */
    constructor(tunnel: Tunnel) {
        super();
        this.tunnel = tunnel;
        this.client = new Client(this.tunnel);
        super.setClientAdapter(new GuacamoleClientAdapter(this.client));

        this.onTunnelInstruction.pipe(
                filter(instruction => instruction && instruction.opcode === 'blob'),
                map(instruction => ({length: atob(instruction.parameters[1]).length})))
            .subscribe(data => {
                this.onDataReceived.next(data);
            });
    }

    /**
     * Get the guacamole tunnel
     */
    public getTunnel(): Tunnel {
        return this.tunnel;
    }


    /**
     * Connect to the remote desktop
     */
    public connect(parameters = {}): void {
        const configuration = this.buildParameters(parameters);
        this.client.connect(configuration);
        this.bindEventHandlers();
    }

    /**
     * Disconnect from the remote desktop
     */
    public disconnect(): void {
        this.client.disconnect();
    }

    /**
     * Generate a thumbnail
     */
    public createThumbnail(width: number = 340, height: number = 240): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            const display = this.client.getDisplay();
            if (display && display.getWidth() > 0 && display.getHeight() > 0) {
                // Get screenshot
                const canvas = display.flatten();
                const scale = Math.min(width / canvas.width, height / canvas.height, 1);

                // Create thumbnail canvas
                const thumbnail = document.createElement('canvas');
                thumbnail.width = canvas.width * scale;
                thumbnail.height = canvas.height * scale;

                // Scale screenshot to thumbnail
                const context = thumbnail.getContext('2d');
                context.drawImage(canvas,
                    0, 0, canvas.width, canvas.height,
                    0, 0, thumbnail.width, thumbnail.height,
                );
                return thumbnail.toBlob(resolve, 'image/jpeg', 0.80);
            } else {
                reject();
            }
        });
    }

    /**
     * Generate a screenshot
     */
    public createScreenshot(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const display = this.client.getDisplay();
            if (display && display.getWidth() > 0 && display.getHeight() > 0) {
                const canvas = display.flatten();
                return canvas.toBlob(resolve);
            } else {
                reject();
            }
        });
    }

    /**
     * Send text to the remote clipboard
     */
    public sendRemoteClipboardData(text: string): void {
        if (text) {
            const stream = this.client.createClipboardStream('text/plain');
            const writer = new StringWriter(stream);
            writer.sendText(text);
            writer.sendEnd();
            this.onRemoteClipboardData.next({content: text, event: 'sent'});
        }

    }

    /**
     * Receive clipboard data from the remote desktop and emit an event to the client
     */
    private handleClipboard(stream: any, mimetype: string): void {
        // If the received data is text, read it as a simple string
        if (/^text\//.exec(mimetype)) {
            const reader = new StringReader(stream);

            // Assemble received data into a single string
            let data = '';
            reader.ontext = (text: string) => data += text;

            // Set clipboard contents once stream is finished
            reader.onend = () => {
                this.onRemoteClipboardData.next({ content: data, event: 'received'});
            };
        }
    }

    /**
     * Build the URL query parameters to send to the tunnel connection
     */
    private buildParameters(parameters = {}): string {
        const params = new URLSearchParams();
        for (const key in parameters) {
            if (parameters.hasOwnProperty(key)) {
                params.set(key, parameters[key]);
            }
        }
        return params.toString();
    }

    /**
     * Bind the client and tunnel event handlers
     */
    private bindEventHandlers(): void {
        this.client.onerror = this.handleClientError.bind(this);
        this.client.onstatechange = this.handleClientStateChange.bind(this);
        this.client.onclipboard = this.handleClipboard.bind(this);
        this.tunnel.onerror = this.handleTunnelError.bind(this);
        this.tunnel.onstatechange = this.handleTunnelStateChange.bind(this);
        /*
         * Override tunnel instruction message
         */
        this.tunnel.oninstruction = ((oninstruction) => {
            return (opcode: string, parameters: any) => {
                oninstruction(opcode, parameters);
                this.onTunnelInstruction.next({opcode, parameters});
            };
        })(this.tunnel.oninstruction);
    }

    /**
     * Handle any client errors by disconnecting and updating the connection state
     */
    private handleClientError(status: any): void {
        // Disconnect if connected
        this.disconnect();
        this.setState(VirtualDesktopManager.STATE.CLIENT_ERROR);
    }

    /**
     * Update the connection state when the client state changes
     */
    private handleClientStateChange(state: number): void {
        switch (state) {
            // Idle
            case 0:
                this.setState(VirtualDesktopManager.STATE.IDLE);
                break;
            // Ignore "connecting" state
            case 1: // Connecting
                break;
            // Connected + waiting
            case 2:
                this.setState(VirtualDesktopManager.STATE.WAITING);
                break;
            // Connected
            case 3:
                this.setState(VirtualDesktopManager.STATE.CONNECTED);
                break;
            // Update history when disconnecting
            case 4: // Disconnecting
            case 5: // Disconnected
                break;
        }
    }

    /**
     * Handle any tunnel errors by disconnecting and updating the connection state
     */
    private handleTunnelError(status: any): void {
        this.disconnect();
        this.setState(VirtualDesktopManager.STATE.TUNNEL_ERROR);
    }

    /**
     * Update the connection state when the tunnel state changes
     */
    private handleTunnelStateChange(state: number): void {
        switch (state) {
            // Connection is being established
            case 1:
                this.setState(VirtualDesktopManager.STATE.CONNECTING);
                break;
            // Connection has closed
            case 2:
                this.setState(VirtualDesktopManager.STATE.DISCONNECTED);
                break;
        }
    }

}
