import {BehaviorSubject, Observable, Subject} from "rxjs";
import {io, ManagerOptions, Socket, SocketOptions} from "socket.io-client";

export type DesktopConnectionData = {
    path?: string;
    token?: string;
}

export type DesktopEvent = {
    event: string;
    data?: any;
}

export class DesktopConnection {

    private _socket: Socket;

    constructor() {
    }

    connect(data: DesktopConnectionData): Observable<DesktopEvent> {
        if (this._socket) {
            return;
        }

        const socketOptions: Partial<ManagerOptions & SocketOptions> = {
            transports: ['websocket'],
            timeout: 1000,
            forceNew: true,
            reconnection: false,
            query: {
                token: data.token
            }
        }

        if (data.path) {
            socketOptions.path = data.path;
        }

        console.log('Connecting to socket.io server');

        const events$ = new Subject<DesktopEvent>();

        this._socket = io(`/desktop-connection`, socketOptions);
        this._socket.onAny((event, data) => {
            if (event === 'disconnect') {
                events$.complete();

            } else {
                events$.next({event, data});
            }
        });

        return events$;
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
