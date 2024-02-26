import {BehaviorSubject, Observable, Subject} from "rxjs";
import {io, Socket} from "socket.io-client";

export type DesktopConnectionData = {
    host?: string;
    path?: string;
    token?: string;
}

export type DesktopEvent = {
    event: string;
    data?: any;
}

export class DesktopConnection {

    private _events$: BehaviorSubject<DesktopEvent> = new BehaviorSubject<DesktopEvent>(null);
    private _socket: Socket;

    get events$(): Observable<DesktopEvent> {
        return this._events$;
    }

    constructor() {
    }

    connect(data: DesktopConnectionData) {
        if (this._socket) {
            return;
        }

        const socketOptions: any = {
            transports: ['websocket'],
            timeout: 1000,
            forceNew: true,
            reconnection: false,
        }

        if (data.path) {
            socketOptions.path = data.path;
        }

        const host = data.host ? `${data.host}` : '';

        console.log('Connecting to socket.io server');

        this._socket = io(`${host}?token=${data.token}`, socketOptions);
        this._socket.on('connected', (data) => {
           console.log('connected');
        });
        // this._socket.onAny((event, data) => {
        //     if (event === 'disconnect') {
        //         this._events$.complete();
        //
        //     } else {
        //         this._events$.next({event, data});
        //     }
        // });
    }

    disconnect(): void {
        if (this._socket) {
            this._socket.disconnect();
            this._socket = null;
        }
    }

    emit(event: string, data: any) {
        if (this._socket) {
            this._socket.emit(event, data);
        }
    }

}
