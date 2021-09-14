import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudImage, ImageInput, ImageProtocol} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-image-update',
    styleUrls: ['./image-update.component.scss'],
    templateUrl: './image-update.component.html',
})
export class ImageUpdateComponent implements OnInit {

    private _onUpdate$: EventEmitter<any> = new EventEmitter();

    private _protocols: ImageProtocol[];
    private _cloudImages: CloudImage[];

    private _imageInput: ImageInput;

    private _selectedProtocols: ImageProtocol[] = [];

    private _imageIcons;

    get onUpdate$(): EventEmitter<any> {
        return this._onUpdate$;
    }

    get protocols(): ImageProtocol[] {
        return this._protocols;
    }

    get cloudImages(): CloudImage[] {
        return this._cloudImages;
    }

    get imageInput(): ImageInput {
        return this._imageInput;
    }

    get selectedProtocols(): ImageProtocol[] {
        return this._selectedProtocols;
    }

    set selectedProtocols(value: ImageProtocol[]) {
        this._selectedProtocols = value;
    }

    get imageIcons(): string[] {
        return this._imageIcons;
    }

    constructor(private dialogRef: MatDialogRef<ImageUpdateComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
    }

    public ngOnInit(): void {
        const image = this._data.image;
        this._imageInput = {
            name: image.name,
            version: image.version,
            description: image.description,
            icon : image.icon,
            computeId : image.computeId,
            visible: image.visible,
            bootCommand: image.bootCommand,
            autologin: image.autologin
        };
        this._imageIcons = this._data.imageIcons;
        this._protocols = this._data.protocols;
        this._cloudImages = this._data.cloudImages;

        this._selectedProtocols = [...this._data.image.protocols];
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        const selectedProtocolsId: number[] = [];
        this._selectedProtocols.forEach((protocol) => {
            selectedProtocolsId.push(protocol.id);
        });
        this._imageInput.protocolIds = selectedProtocolsId;
        this._onUpdate$.emit(this._imageInput);
    }

}
