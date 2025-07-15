import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {AccountService, EventsGateway, GatewayEventSubscriber, InstanceThumbnailUpdatedEvent} from "@core";
import {takeUntil} from "rxjs/operators";

@Component({
    selector: 'visa-instance-thumbnail',
    template: `<img *ngIf="imageUrl" [src]="imageUrl"/>`,
    encapsulation: ViewEncapsulation.None,
    styles: ['img { max-width: 100%; max-height: 100%; display: block; object-fit: contain }'],
})
export class InstanceThumbnailComponent implements OnInit, OnDestroy {

    private _uid: string;
    private _refreshable = true;
    private _refresh$: Observable<void>;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _gatewayEventSubscriber: GatewayEventSubscriber;

    public imageUrl: string | null = null;

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
        this.releaseImageUrl();
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
        if (this._refreshable) {
            this.unbindEventGatewayListeners();
        }
    }

    private updateImage(): void {
        this.accountService.getThumbnailDataForInstanceUid(this._uid).subscribe((blob) => {
            this.releaseImageUrl();
            this.imageUrl = URL.createObjectURL(blob);
        });
    }

    private releaseImageUrl(): void {
        if (this.imageUrl) {
            URL.revokeObjectURL(this.imageUrl);
            this.imageUrl = null;
        }
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
