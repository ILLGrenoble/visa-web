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

export class EventChannel {

    private _socket: WebSocketSubject<DesktopEvent>;

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

        return this._socket;
    }

    disconnect(): void {
        if (this._socket) {
            this._socket.unsubscribe();
            this._socket = null;
        }
    }

    emit(type: string, data: any) {
        if (this._socket) {
            this._socket.next({type, data});
        }
    }

}
