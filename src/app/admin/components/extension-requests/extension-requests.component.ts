import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {Title} from '@angular/platform-browser';
import {InstanceExtensionRequest} from '../../../core/graphql';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {EventsGateway, GatewayEventSubscriber, NotificationService} from '../../../core';

@Component({
    selector: 'visa-admin-extension-requests',
    styleUrls: ['./extension-requests.component.scss'],
    templateUrl: './extension-requests.component.html',
})

export class ExtensionRequestsComponent implements OnInit, OnDestroy {

    private _extensionRequests: InstanceExtensionRequest[] = [];
    private _loading: boolean;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _gatewayEventSubscriber: GatewayEventSubscriber;

    private _modalData$ = new Subject<{ request: InstanceExtensionRequest }>();

    get extensionRequests(): InstanceExtensionRequest[] {
        return this._extensionRequests;
    }

    get loading(): boolean {
        return this._loading;
    }

    get modalData$(): Subject<{ request: InstanceExtensionRequest }> {
        return this._modalData$;
    }

    constructor(private apollo: Apollo,
                private notificationService: NotificationService,
                private titleService: Title,
                private eventsGateway: EventsGateway) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Extension Requests | Compute | Admin | VISA`);
        this.load();
        this.bindEventGatewayListeners();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
        this.unbindEventGatewayListeners();
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

    public onHandle(request: InstanceExtensionRequest): void {
        this._modalData$.next({ request });
    }

    public onExtensionRequestHandled(): void {
        this.notificationService.getAll();
        this.load();
    }

    private load(): void {
        this._loading = true;

        this.apollo.query<any>({
            query: gql`
                query instanceExtensionRequests {
                    instanceExtensionRequests {
                        id
                        comments
                        createdAt
                        instance {
                            id
                            uid
                            name
                            state
                            plan {
                                image {
                                    id
                                    name
                                    version
                                }
                                flavour {
                                    id
                                    name
                                }
                            }
                            createdAt
                            lastSeenAt
                            terminationDate
                            owner {
                                id
                                fullName
                                affiliation {
                                    name
                                }
                                email
                            }
                            username
                            bookingToken {
                                bookingRequest {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            `,
        }).pipe(
            map(({data}) => (data.instanceExtensionRequests)),
            takeUntil(this._destroy$)
        ).subscribe((instanceExtensionRequests) => {
            this._extensionRequests = instanceExtensionRequests;
            this._loading = false;
        });
    }

    private bindEventGatewayListeners(): void {
        this._gatewayEventSubscriber = this.eventsGateway.subscribe()
            .on('admin:extension_requests_changed', _ => {
                this.load();
            });
    }

    private unbindEventGatewayListeners(): void {
        if (this._gatewayEventSubscriber != null) {
            this.eventsGateway.unsubscribe(this._gatewayEventSubscriber);
            this._gatewayEventSubscriber = null;
        }
    }
}
