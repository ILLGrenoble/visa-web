import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {Injectable} from "@angular/core";
import {AccountService} from "./account.service";
import * as uuid from 'uuid';
import {environment} from "../../../environments/environment";
import { switchMap } from "rxjs/operators";
import {AuthenticationService} from "./authentication.service";


export function eventGatewayInitializerFactory(eventGateway: EventGateway): () => void {
    return () => eventGateway.init();
}
export type GatewayEvent = {
    type: string;
    data?: any;
}

type GatewayEventHandler = {
    type: string;
    callback: (data: any) => void;
}

export class GatewayEventSubscriber {
    private _eventHandlers: GatewayEventHandler[] = [];

    on(type: string, callback: (data: any) => void): GatewayEventSubscriber {
        this._eventHandlers.push({type, callback});
        return this;
    }

    handleGatewayEvent(type: string, data?: any): void {
        this._eventHandlers.filter(handler => handler.type === type).forEach((handler) => {
            handler.callback(data);
        });
    }
}

@Injectable()
export class EventGateway {

    private readonly _clientId: string;
    private _socket: WebSocketSubject<GatewayEvent>;
    private _subscribers: GatewayEventSubscriber[] = [];

    get clientId(): string {
        return this._clientId;
    }

    constructor(private _accountService: AccountService,
                private _authenticationService: AuthenticationService) {
        this._clientId = uuid.v4();
    }

    public init(): void {
        this._authenticationService.onLoggedIn(() => this.connect());
        this._authenticationService.onLoggedOut(() => this.disconnect());
    }

    public connect(): WebSocketSubject<GatewayEvent> {
        if (this._socket) {
            return this._socket;
        }

        this._socket = this._accountService.createClientAuthenticationToken(this._clientId).pipe(
            switchMap(token => {
                const url = `${environment.paths.api}/ws/${token}/${this._clientId}/gateway`;

                // console.log(`Connecting to socket server at ${url}`);

                return webSocket<GatewayEvent>(url);
            })) as WebSocketSubject<GatewayEvent>;

        this._subscribers = [];

        this._socket.subscribe({
            next: (desktopEvent: GatewayEvent) => {
                this._handleGatewayEvent(desktopEvent.type, desktopEvent.data);
            },
        });

        return this._socket;
    }

    subscribe(): GatewayEventSubscriber {
        const gatewayEventSubscriber = new GatewayEventSubscriber();
        this._subscribers.push(gatewayEventSubscriber);
        return gatewayEventSubscriber;
    }

    unsubscribe(subscriber: GatewayEventSubscriber): void {
        this._subscribers = this._subscribers.filter(aSubscriber => aSubscriber !== subscriber);
    }

    disconnect(): void {
        if (this._socket) {
            this._socket.unsubscribe();
            this._socket = null;
        }
        this._subscribers = [];
    }

    emit(type: string, data: any) {
        if (this._socket) {
            this._socket.next({type, data});
        }
    }

    private _handleGatewayEvent(type: string, data?: any): void {
        this._subscribers.forEach(subscriber => subscriber.handleGatewayEvent(type, data));
    }

}
