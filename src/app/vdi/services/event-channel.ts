import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

export type DesktopConnectionData = {
    path?: string;
    token?: string;
    protocol?: string;
}

export type DesktopEvent = {
    type: string;
    data?: any;
}

type EventHandler = {
    type: string;
    callback: (data: any) => void;
}

export class EventChannel {

    private _socket: WebSocketSubject<DesktopEvent>;
    private _eventHandlers: EventHandler[] = [];

    constructor() {
    }

    connect(data: DesktopConnectionData): WebSocketSubject<DesktopEvent> {
        if (this._socket) {
            return;
        }

        const {path, token, protocol} = data;

        const url = `${path}/${token}?protocol=${protocol}`;

        // console.log(`Connecting to socket server at ${url}`);

        this._socket = webSocket<DesktopEvent>(url);

        this._eventHandlers = [];

        this._socket.subscribe({
            next: (desktopEvent: DesktopEvent) => {
                this._handleDesktopEvent(desktopEvent.type, desktopEvent.data);
            },
        })

        return this._socket;
    }

    on(type: string, callback: (data: any) => void): EventChannel {
        this._eventHandlers.push({type, callback});
        return this;
    }

    disconnect(): void {
        if (this._socket) {
            this._socket.unsubscribe();
            this._socket = null;
        }
        this._eventHandlers = [];
    }

    emit(type: string, data: any) {
        if (this._socket) {
            this._socket.next({type, data});
        }
    }

    private _handleDesktopEvent(type: string, data?: any): void {
        this._eventHandlers.filter(handler => handler.type === type).forEach((handler) => {
            handler.callback(data);
        });
    }

}
