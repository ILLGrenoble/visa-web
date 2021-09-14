import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CloudImage, ImageInput, ImageProtocol} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-image-new',
    styleUrls: ['./image-new.component.scss'],
    templateUrl: './image-new.component.html',
})
export class ImageNewComponent implements OnInit {

    private _onCreate$: EventEmitter<any> = new EventEmitter();

    private _protocols: ImageProtocol[];
    private _cloudImages: CloudImage[];

    private _imageInput: ImageInput = {
        name: null,
        visible: false,
        protocolIds: [],
        computeId: null,
        autologin: null,
        icon: null,
        bootCommand: null,
        version: null,
        description: null
    };

    private _selectedProtocols: ImageProtocol[] = [];

    private _imageIcons: string[];

    get onCreate$(): EventEmitter<any> {
        return this._onCreate$;
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

    constructor(private _dialogRef: MatDialogRef<ImageNewComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
    }

    public ngOnInit(): void {
        this._imageIcons = this._data.imageIcons;
        this._protocols = this._data.protocols;
        this._cloudImages = this._data.cloudImages;
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const selectedProtocolsId: number[] = [];
        this.selectedProtocols.forEach((protocol) => {
            selectedProtocolsId.push(protocol.id);
        });
        this._imageInput.protocolIds = selectedProtocolsId;
        this._onCreate$.emit(this._imageInput);
    }

}
