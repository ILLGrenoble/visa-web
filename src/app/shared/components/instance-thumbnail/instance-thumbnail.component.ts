import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {
    AccountService,
    EventsGateway,
    GatewayEventSubscriber,
    Instance,
    InstanceThumbnailUpdatedEvent
} from "@core";

@Component({
    selector: 'visa-instance-thumbnail',
    template: `<img *ngIf="uid" [src]="dynamicUrl"/>`,
    encapsulation: ViewEncapsulation.None,
    styles: ['img { max-width: 100%; max-height: 100%; display: block; object-fit: contain }'],
})
export class InstanceThumbnailComponent implements OnInit, OnDestroy {

    private _uid: string;
    private _refreshable = true;
    private _rand: number;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _gatewayEventSubscriber: GatewayEventSubscriber;

    get uid(): string {
        return this._uid;
    }

    @Input('uid')
    set instance(uid: string) {
        this._uid = uid;
    }

    get refreshable(): boolean {
        return this._refreshable;
    }

    @Input('refreshable')
    set refreshable(value: boolean) {
        this._refreshable = value;
    }

    get dynamicUrl(): string {
        const url = this.accountService.getThumbnailUrlForInstanceUid(this._uid);

        return `${url}?${this._rand}`;
    }

    constructor(private accountService: AccountService,
                private eventsGateway: EventsGateway) {
    }

    public ngOnInit(): void {
        this.updateRand();
        if (this._refreshable) {
            this.bindEventGatewayListeners();
        }
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
        if (this._refreshable) {
            this.unbindEventGatewayListeners();
        }
    }

    private updateRand(): void {
        this._rand = Math.floor(Math.random() * 999999999);
    }

    private bindEventGatewayListeners(): void {
        this._gatewayEventSubscriber = this.eventsGateway.subscribe()
            .on('user:instance_thumbnail_updated', (event: InstanceThumbnailUpdatedEvent) => {
                if (event.instanceUid === this._uid) {
                    this.updateRand();
                }
            });
    }

    private unbindEventGatewayListeners(): void {
        if (this._gatewayEventSubscriber != null) {
            this.eventsGateway.unsubscribe(this._gatewayEventSubscriber);
            this._gatewayEventSubscriber = null;
        }
    }
}
