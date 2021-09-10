import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CloudImage, Image, ImageConnection, ImageProtocol, PageInfo, Pagination} from 'app/core/graphql/types';
import {cloneDeep} from 'lodash';
import {ImageDeleteComponent} from '../image-delete';
import {ImageNewComponent} from '../image-new';
import {ImageUpdateComponent} from '../image-update';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-images',
    styleUrls: ['./images.component.scss'],
    templateUrl: './images.component.html',
})

export class ImagesComponent implements OnInit, OnDestroy {

    @ViewChild('datagridRef') public datagrid: any;
    public pageInfo: PageInfo;
    public pageSize = 20;
    public images: Image[] = [];
    public imageCloudImageName: string[] = [];
    public loading: boolean;

    private cloudImages: CloudImage[];
    private protocols: ImageProtocol[] = [];
    private imageIcons = ['data-analysis-1.jpg', 'data-analysis-2.jpg', 'data-analysis-3.jpg'];
    private state = {page: {from: 0, size: this.pageSize}};

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private apollo: Apollo,
                private snackBar: MatSnackBar,
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
                        deleted
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
            setTimeout(() => this.datagrid.resize());
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
                        deleted
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
        dialogRef.componentInstance.create.subscribe((imageInput: any) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation CreateImage($input: CreateImageInput!){
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
                    this.imageSnackBar('Image created');
                    this.loadProtocolsImages();
                }).catch((error) => {
                    this.imageSnackBar(error);
                });
        });
    }

    public onDelete(imageId): void {
        const dialogRef = this.dialog.open(ImageDeleteComponent, {
            width: '300px', data: {image: this.images.find((x) => x.id === imageId)},
        });
        dialogRef.componentInstance.delete.subscribe(() => {
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
                    this.imageSnackBar('Image deleted');
                    this.loadImages();
                });
        });
    }

    public onUpdate(image): void {
        const dialogRef = this.dialog.open(ImageUpdateComponent, {
            width: '900px', data: {
                image: cloneDeep(image), imageIcons: this.imageIcons,
                cloudImages: this.cloudImages, protocols: this.protocols,
            },
        });
        dialogRef.componentInstance.update.subscribe(async (data) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation UpdateImage($id: Int!,$input: UpdateImageInput!){
                        updateImage(id:$id,input:$input) {
                            id
                        }
                    }
            `,
                variables: {id: image.id, input: data},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.imageSnackBar('Image Updated');
                    this.loadProtocolsImages();
                }).catch((error) => {
                    this.imageSnackBar(error);
                });
        });
    }

    private imageSnackBar(message): void {
        this.snackBar.open(message, 'OK', {
            duration: 4000,
        });
    }
}
