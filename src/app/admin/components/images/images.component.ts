import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {lastValueFrom, Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';
import {Image, ImageInput} from '../../../core/graphql';
import {ImageDeleteComponent} from '../image-delete';
import {ImageEditComponent} from '../image-edit';

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

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _dialog: MatDialog,
                private readonly _titleService: Title) {
    }

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
                this._multiCloudEnabled = cloudClients.length > 1;
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }


    public onCreate(image?: Image): void {
        const dialogRef = this._dialog.open(ImageEditComponent, {
            width: '900px',
            data: {image, clone: !!image}
        });

        dialogRef.componentInstance.onSave$.subscribe((input: ImageInput) => {
            const source$ = this._apollo.mutate<any>({
                mutation: gql`
                        mutation CreateImage($input: ImageInput!){
                            createImage(input:$input) {
                              id
                              name
                              version
                              description
                              icon
                              computeId
                            }
                        }
                    `,
                variables: {input},
            }).pipe(
                takeUntil(this._destroy$)
            );
            lastValueFrom(source$).then(() => {
                this._notifierService.notify('success', 'Image created');
                this._refresh$.next();
                dialogRef.close();
            }).catch((error) => {
                this._notifierService.notify('error', error);
            });
        });
    }

    public onDelete(image: Image): void {

        const dialogRef = this._dialog.open(ImageDeleteComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const source$ = this._apollo.mutate({
                    mutation: gql`
                        mutation DeleteImage($id: Int!){
                            deleteImage(id:$id) {
                                id
                            }
                        }
                    `,
                    variables: {id: image.id},
                }).pipe(
                    takeUntil(this._destroy$)
                );
                lastValueFrom(source$).then(_ => {
                    this._notifierService.notify('success', 'Successfully deleted image');
                    this._refresh$.next();
                });
            }
        });
    }

    public onUpdate(image: Image): void {
        const dialogRef = this._dialog.open(ImageEditComponent, {
            width: '900px',
            data: {image}
        });

        dialogRef.componentInstance.onSave$.subscribe((input: ImageInput) => {
            const source$ = this._apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateImage($id: Int!,$input: ImageInput!){
                        updateImage(id:$id,input:$input) {
                            id
                        }
                    }
                    `,
                variables: {id: image.id, input},
            }).pipe(
                takeUntil(this._destroy$)
            );
            lastValueFrom(source$).then(() => {
                this._notifierService.notify('success', 'Image saved');
                this._refresh$.next();
                dialogRef.close();
            }).catch((error) => {
                this._notifierService.notify('error', error);
            });
        });
    }

}
