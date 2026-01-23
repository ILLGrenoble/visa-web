import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {Image} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-images',
    templateUrl: './images.component.html',
})

export class ImagesComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _images: Image[] = [];
    private _loading: boolean;
    private _multiCloudEnabled = false;

    private _modalData$ = new Subject<{ image: Image, clone: boolean }>();
    private _imageToDelete: Image;

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get images(): Image[] {
        return this._images;
    }

    set images(value: Image[]) {
        this._images = value;
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    get modalData$(): Subject<{ image: Image; clone: boolean }> {
        return this._modalData$;
    }

    get showDeleteModal(): boolean {
        return this._imageToDelete != null;
    }

    get imageToDelete(): Image {
        return this._imageToDelete;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title) {
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Images | Cloud | Admin | VISA`);
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query allImages {
                            images {
                                id
                                name
                                version
                                description
                                visible
                                icon
                                computeId
                                cloudClient {
                                    id
                                    name
                                }
                                cloudImage {
                                    id
                                    name
                                }
                                bootCommand
                                visible
                                autologin
                                protocols {
                                    id
                                    name
                                }
                                defaultVdiProtocol {
                                  id
                                  name
                                }
                                secondaryVdiProtocol {
                                  id
                                  name
                                }
                                autoAcceptExtensionRequest
                            }
                            cloudClients {
                                id
                            }
                        }
                    `
                })),
                map(({data}) => ({images: data.images, cloudClients: data.cloudClients})),
                tap(() => this._loading = false)
            )
            .subscribe(({images, cloudClients}) => {
                this._images = images;

                this._multiCloudEnabled = cloudClients.length > 1 || images
                    .map((image) => image.cloudClient?.id || 0)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }


    public onCreate(image?: Image): void {
        this.modalData$.next({image: image, clone: !!image});
    }

    public onDelete(image: Image): void {
        this._imageToDelete = image;
    }

    public onConfirmDelete(): void {
        if (this._imageToDelete) {
            this._apollo.mutate({
                mutation: gql`
                mutation DeleteImage($id: Int!) {
                    deleteImage(id: $id) {
                        id
                    }
                }
            `,
                variables: {id: this._imageToDelete.id},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._imageToDelete = null;
                    this._notifierService.notify('success', 'Successfully deleted image');
                    this._refresh$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }
    }

    public onDeleteModalClosed(): void {
        this._imageToDelete = null;
    }

    public onUpdate(image: Image): void {
        this.modalData$.next({image: image, clone: false});
    }

    public onImageSaved(): void {
        this._refresh$.next();
    }

}
