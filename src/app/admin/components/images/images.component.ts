import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {CloudImage, Image, ImageProtocol} from 'app/core/graphql/types';
import {ImageDeleteComponent} from '../image-delete';
import {ImageNewComponent} from '../image-new';
import {ImageUpdateComponent} from '../image-update';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {map, takeUntil} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-admin-images',
    styleUrls: ['./images.component.scss'],
    templateUrl: './images.component.html',
})

export class ImagesComponent implements OnInit, OnDestroy {

    public images: Image[] = [];
    public imageCloudImageName: string[] = [];
    public loading: boolean;

    private cloudImages: CloudImage[];
    private protocols: ImageProtocol[] = [];
    private imageIcons = ['data-analysis-1.jpg', 'data-analysis-2.jpg', 'data-analysis-3.jpg'];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.loadProtocolsImages();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadImages();
    }

    public loadProtocolsImages(): void {
        this.loading = true;

        this.apollo.query<any>({
            query: gql`
                query All {
                    images {
                        id
                        name
                        version
                        description
                        visible
                        icon
                        computeId
                        protocols{
                            id
                            name
                        }
                        bootCommand
                        autologin
                    }
                    imageProtocols {
                        id
                        name
                    }
                    cloudImages {
                        id
                        name
                    }
                }
            `,
        }).pipe(
            map(({data}) => ({images: data.images, protocols: data.imageProtocols, cloudImages: data.cloudImages})),
            takeUntil(this._destroy$)
        ).subscribe(({images, protocols, cloudImages}) => {
            this.images = images;
            this.protocols = protocols;
            this.cloudImages = cloudImages;

            this.imageCloudImageName = this.images.map((image) => {
                const resultCloudImage = cloudImages.find((cloudImage) => cloudImage.id === image.computeId);
                if (resultCloudImage) {
                    return resultCloudImage.name;
                } else {
                    return null;
                }
            });
            this.loading = false;
        });
    }

    public loadImages(): void {
        this.loading = true;

        this.apollo.query<any>({
            query: gql`
                query AllImages {
                    images {
                        id
                        name
                        version
                        description
                        visible
                        icon
                        computeId
                        protocols{
                            id
                            name
                        }
                    }
                }
            `,
        }).pipe(
            map(({data}) => (data.images)),
            takeUntil(this._destroy$)
        ).subscribe((images) => {
            this.images = images;
            this.loading = false;
        });
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(ImageNewComponent, {
            width: '900px',
            data: {imageIcons: this.imageIcons, cloudImages: this.cloudImages, protocols: this.protocols},
        });
        dialogRef.componentInstance.onCreate$.subscribe((imageInput: any) => {
            this.apollo.mutate<any>({
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
                variables: {input: imageInput},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.showSuccessNotification('Image created');
                    this.loadProtocolsImages();
                }).catch((error) => {
                this.showErrorNotification(error);
            });
        });
    }

    public onDelete(imageId): void {
        const dialogRef = this.dialog.open(ImageDeleteComponent, {
            width: '300px', data: {image: this.images.find((x) => x.id === imageId)},
        });
        dialogRef.componentInstance.onDelete$.subscribe(() => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation DeleteImage($id: Int!){
                        deleteImage(id:$id) {
                            id
                        }
                    }
                `,
                variables: {id: imageId},
            }).toPromise()
                .then(() => {
                    this.showSuccessNotification('Image deleted');
                    this.loadImages();
                });
        });
    }

    public onUpdate(image: Image): void {
        const dialogRef = this.dialog.open(ImageUpdateComponent, {
            width: '900px', data: {
                image,
                imageIcons: this.imageIcons,
                cloudImages: this.cloudImages,
                protocols: this.protocols,
            },
        });
        dialogRef.componentInstance.onUpdate$.subscribe(async (data) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateImage($id: Int!,$input: ImageInput!){
                        updateImage(id:$id,input:$input) {
                            id
                        }
                    }
            `,
                variables: {id: image.id, input: data},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.showSuccessNotification('Image Updated');
                    this.loadProtocolsImages();
                }).catch((error) => {
                this.showErrorNotification(error);
            });
        });
    }

    private showSuccessNotification(message): void {
        this.notifierService.notify('success', message);
    }

    private showErrorNotification(message): void {
        this.notifierService.notify('error', message);
    }
}
