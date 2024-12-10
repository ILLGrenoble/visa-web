import {
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {
    AccountService,
    EventsGateway,
    GatewayEventSubscriber,
    InstanceThumbnailUpdatedEvent
} from "@core";
import {takeUntil} from "rxjs/operators";

@Component({
    selector: 'visa-instance-thumbnail',
    template: `<img *ngIf="uid" [src]="dynamicUrl"/>`,
    encapsulation: ViewEncapsulation.None,
    styles: ['img { max-width: 100%; max-height: 100%; display: block; object-fit: contain }'],
})
export class InstanceThumbnailComponent implements OnInit, OnDestroy {

    private _uid: string;
    private _refreshable = true;
    private _refresh$: Observable<void>;
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

    @Input('refresh')
    set refresh$(value: Observable<void>) {
        this._refresh$ = value;
    }

    constructor(private accountService: AccountService,
                private eventsGateway: EventsGateway) {
    }

    public ngOnInit(): void {
        this.updateImage();
        if (this._refreshable) {
            this.bindEventGatewayListeners();
        }
        if (this._refresh$) {
            this._refresh$.pipe(
                takeUntil(this._destroy$)
            ).subscribe(() => this.updateImage());
        }
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
        if (this._refreshable) {
            this.unbindEventGatewayListeners();
        }
    }

    private updateImage(): void {
        this._rand = Math.floor(Math.random() * 999999999);
    }

    private bindEventGatewayListeners(): void {
        this._gatewayEventSubscriber = this.eventsGateway.subscribe()
            .on('user:instance_thumbnail_updated', (event: InstanceThumbnailUpdatedEvent) => {
                if (event.instanceUid === this._uid) {
                    this.updateImage();
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
