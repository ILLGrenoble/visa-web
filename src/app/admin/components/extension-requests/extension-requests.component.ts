import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {InstanceExtensionRequest} from '../../../core/graphql';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-extension-requests',
    styleUrls: ['./extension-requests.component.scss'],
    templateUrl: './extension-requests.component.html',
})

export class ExtensionRequestsComponent implements OnInit, OnDestroy {

    private _extensionRequests: InstanceExtensionRequest[] = [];
    private _loading: boolean;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get extensionRequests(): InstanceExtensionRequest[] {
        return this._extensionRequests;
    }

    get loading(): boolean {
        return this._loading;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private dialog: MatDialog,
                private titleService: Title) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Extension Requests | Compute | Admin | VISA`);
        this.load();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
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
                                    name
                                    version
                                }
                                flavour {
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

    private showSuccessNotification(message): void {
        this.notifierService.notify('success', message);
    }

    private showErrorNotification(message): void {
        this.notifierService.notify('error', message);
    }
}
