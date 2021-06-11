import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CloudImage, Image, ImageConnection, ImageProtocol, PageInfo, Pagination} from 'app/core/graphql/types';
import {cloneDeep} from 'lodash';
import {ImageService} from '../../services';
import {ImageDeleteComponent} from '../image-delete';
import {ImageNewComponent} from '../image-new';
import {ImageUpdateComponent} from '../image-update';

@Component({
    selector: 'visa-admin-images',
    styleUrls: ['./images.component.scss'],
    templateUrl: './images.component.html',
})

export class ImagesComponent implements OnInit {

    @ViewChild('datagridRef') public datagrid: any;
    public pageInfo: PageInfo;
    public pageSize = 20;
    public images: Image[] = [];
    public imageCloudImageName: string[] = [];
    public loading: boolean;

    private imageConnection: ImageConnection;
    private imagePagination: Pagination;

    private cloudImages: CloudImage[];
    private protocols: ImageProtocol[] = [];
    private imageIcons = ['data-analysis-1.jpg', 'data-analysis-2.jpg', 'data-analysis-3.jpg'];
    private state = {page: {from: 0, size: this.pageSize}};

    constructor(private imageService: ImageService,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public async ngOnInit(): Promise<void> {
        this.imagePagination = {offset: this.state.page.from, limit: this.state.page.size};
        await this.loadProtocolsImages();
        setTimeout(() => this.datagrid.resize());
    }

    public async onRefresh(): Promise<void> {
        await this.loadImages();
    }

    public async loadProtocolsImages(): Promise<void> {
        this.loading = true;

        const {imageConnection, protocols, cloudImages} = await this.imageService.getAll(this.imagePagination);
        this.images = imageConnection.data;
        this.pageInfo = imageConnection.pageInfo;
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
    }

    public async loadImages(): Promise<void> {
        this.loading = true;
        this.imageConnection = await this.imageService.getImages(this.imagePagination);
        this.images = this.imageConnection.data;
        this.pageInfo = this.imageConnection.pageInfo;
        this.loading = false;
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(ImageNewComponent, {
            width: '900px',
            data: {imageIcons: this.imageIcons, cloudImages: this.cloudImages, protocols: this.protocols},
        });
        dialogRef.componentInstance.create.subscribe((data: any) => {
            this.imageService.createImage(data).then(async () => {
                dialogRef.close();
                this.imageSnackBar('Image created');
                await this.loadProtocolsImages();
            }).catch((error) => {
                this.imageSnackBar(error);
            });
        });
    }

    public onDelete(imageId): void {
        const dialogRef = this.dialog.open(ImageDeleteComponent, {
            width: '300px', data: {image: this.images.find((x) => x.id === imageId)},
        });
        dialogRef.componentInstance.delete.subscribe(async () => {
            const response = await this.imageService.deleteImage(imageId).then();
            if (response) {
                this.imageSnackBar('Image deleted');
                await this.loadImages();
            }
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
            this.imageService.updateImage(image.id, data).then(async () => {
                dialogRef.close();
                this.imageSnackBar('Image Updated');
                await this.loadProtocolsImages();
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
