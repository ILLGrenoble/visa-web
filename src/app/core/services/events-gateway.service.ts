import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {Inject, Injectable} from "@angular/core";
import {AccountService} from "./account.service";
import * as uuid from 'uuid';
import {environment} from "../../../environments/environment";
import {filter} from "rxjs/operators";
import {Store} from "@ngrx/store";
import {ApplicationState} from "../state";
import {selectLoggedInUser} from "../reducers";
import defaultOptions, {EventsGatewayConfig} from "./models/events-gateway-config.model";
import {timer} from "rxjs";
import {convertJsonDates} from "./models/json-date-converter";


export function eventsGatewayInitializerFactory(eventGateway: EventsGateway): () => void {
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

type ReconnectionState = {
    delay: number,
    attempt: number,
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
export class EventsGateway {

    private readonly _clientId: string;
    private _socket: WebSocketSubject<GatewayEvent>;
    private _subscribers: GatewayEventSubscriber[] = [];
    private _config: EventsGatewayConfig;
    private _reconnectionState: ReconnectionState;

    get clientId(): string {
        return this._clientId;
    }

    constructor(private _accountService: AccountService,
                private _store: Store<ApplicationState>,
                @Inject('EVENT_GATEWAY_CONFIG') eventGatewayConfig?: EventsGatewayConfig) {
        this._clientId = uuid.v4();
        this._config = {...defaultOptions, ...eventGatewayConfig};
    }

    public init(): void {
        // When we have a logged-in user then connect to the event gateway
        this._store.select(selectLoggedInUser).pipe(filter(user => !!user)).subscribe(_ => {
            this.connect();
        });
    }

    public connect(): void {
        if (this._socket) {
            return;
        }

        this._accountService.createClientAuthenticationToken(this._clientId).subscribe({
            next: token => {
                const url = `${environment.paths.api}/ws/${token}/${this._clientId}/gateway`;

                this._reconnectionState = null;

                this._socket = webSocket<GatewayEvent>(url);
                this._socket.subscribe({
                    next: (desktopEvent: GatewayEvent) => {
                        this._handleGatewayEvent(desktopEvent.type, desktopEvent.data);
                    },
                    error: () => {
                        this._socket = null;
                        this._handleReconnection();
                    },
                    complete: () => {
                        this._socket = null;
                        this._handleReconnection();
                    }
                });
            },
            error: _ => {
                this._handleReconnection();
            }
        });
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
        convertJsonDates(data);
        this._subscribers.forEach(subscriber => subscriber.handleGatewayEvent(type, data));
    }

    private _handleReconnection(): void {
        if (!this._config.reconnection) {
            return;
        }

        if (this._reconnectionState == null) {
            this._reconnectionState = {
                delay: this._config.reconnectionDelay,
                attempt: 0
            }
        } else {
            this._reconnectionState.delay = Math.min(this._reconnectionState.delay * 2, this._config.reconnectionDelayMax);
            this._reconnectionState.attempt++;
        }

        if (this._reconnectionState.attempt < this._config.reconnectionAttempts) {
            // Run reconnection timer
            timer(this._reconnectionState.delay).subscribe(() => {
                this.connect();
            });

        } else {
            console.log(`Reached maximum number of Event Gateway reconnection attempts (${this._config.reconnectionAttempts})`);
        }
    }
}
