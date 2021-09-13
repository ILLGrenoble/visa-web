import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudImage, ImageInput, ImageProtocol} from '../../../core/graphql/types';

@Component({
    selector: 'visa-admin-image-new',
    styleUrls: ['./image-new.component.scss'],
    templateUrl: './image-new.component.html',
})
export class ImageNewComponent implements OnInit {

    public create: EventEmitter<any> = new EventEmitter();

    public protocols: ImageProtocol[];
    public cloudImages: CloudImage[];

    public nameInput: string;
    public versionInput: string;
    public descriptionInput: string;
    public selectedCloudImageId: string;
    public selectedProtocols: ImageProtocol[] = [];
    public selectedIcon: string;
    public imageVisible = false;
    public bootCommand: string = null;
    public autologin: string = null;
    public imageIcons: string[];

    constructor(public dialogRef: MatDialogRef<ImageNewComponent>,
                @Inject(MAT_DIALOG_DATA) public data) {
    }

    public ngOnInit(): void {
        this.imageIcons = this.data.imageIcons;
        this.protocols = this.data.protocols;
        this.cloudImages = this.data.cloudImages;
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
            name: this.nameInput,
            version: this.versionInput,
            description: this.descriptionInput,
            icon: this.selectedIcon,
            computeId: this.selectedCloudImageId,
            visible: this.imageVisible,
            deleted: false,
            protocolIds: selectedProtocolsId,
            bootCommand: this.bootCommand,
            autologin: this.autologin
        };
        this.create.emit(imageInput);
    }

}
