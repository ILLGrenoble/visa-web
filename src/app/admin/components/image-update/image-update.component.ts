import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudImage, Image, ImageInput, ImageProtocol} from '../../../core/graphql/types';

@Component({
    selector: 'visa-admin-image-update',
    styleUrls: ['./image-update.component.scss'],
    templateUrl: './image-update.component.html',
})
export class ImageUpdateComponent implements OnInit {

    private _update: EventEmitter<any> = new EventEmitter();
    private _protocols: ImageProtocol[];
    private _cloudImages: CloudImage[];
    private _selectedProtocols: ImageProtocol[] = [];
    private _image: Image;
    private _imageIcons;
    private _autologin: string;

    get update(): EventEmitter<any> {
        return this._update;
    }

    set update(value: EventEmitter<any>) {
        this._update = value;
    }

    get protocols(): ImageProtocol[] {
        return this._protocols;
    }

    set protocols(value: ImageProtocol[]) {
        this._protocols = value;
    }

    get cloudImages(): CloudImage[] {
        return this._cloudImages;
    }

    set cloudImages(value: CloudImage[]) {
        this._cloudImages = value;
    }

    get selectedProtocols(): ImageProtocol[] {
        return this._selectedProtocols;
    }

    set selectedProtocols(value: ImageProtocol[]) {
        this._selectedProtocols = value;
    }

    get image(): Image {
        return this._image;
    }

    set image(value: Image) {
        this._image = value;
    }

    get imageIcons(): any {
        return this._imageIcons;
    }

    set imageIcons(value) {
        this._imageIcons = value;
    }

    get autologin(): string {
        return this._autologin;
    }

    set autologin(value: string) {
        this._autologin = value;
    }

    constructor(public dialogRef: MatDialogRef<ImageUpdateComponent>, @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.image = this.data.image;
        this.imageIcons = this.data.imageIcons;
        this.protocols = this.data.protocols;
        this.cloudImages = this.data.cloudImages;
        this.selectedProtocols = this.data.image.protocols;
        this.autologin = this.data.autologin;
    }

    public onNoClick(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        const selectedProtocolsId: number[] = [];
        this.selectedProtocols.forEach((protocol) => {
            selectedProtocolsId.push(protocol.id);
        });
        const imageInput: ImageInput = {
            name: this.image.name,
            version: this.image.version,
            description: this.image.description,
            icon : this.image.icon,
            computeId : this.image.computeId,
            protocolIds: selectedProtocolsId,
            visible: this.image.visible,
            bootCommand:  this.image.bootCommand,
            autologin: this.image.autologin,
            deleted: false
        };
        this._update.emit(imageInput);
    }

}
