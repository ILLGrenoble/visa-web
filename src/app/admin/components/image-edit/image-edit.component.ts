import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {CloudImage, CloudNetwork, Image, ImageInput, ImageProtocol} from '../../../core/graphql';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';

@Component({
    selector: 'visa-admin-image-edit',
    templateUrl: './image-edit.component.html',
})
export class ImageEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _icons = ['data-analysis-1.jpg', 'data-analysis-2.jpg', 'data-analysis-3.jpg'];
    private _dialogRef: MatDialogRef<ImageEditComponent>;
    private _cloudImages: CloudImage[] = [];
    private _cloudNetworks: CloudNetwork[] = [];
    private _protocols: ImageProtocol[] = [];
    private _apollo: Apollo;
    private _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<ImageInput> = new Subject<ImageInput>();

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get cloudImages(): CloudImage[] {
        return this._cloudImages;
    }

    get cloudNetworks(): CloudNetwork[] {
        return this._cloudNetworks;
    }

    get protocols(): ImageProtocol[] {
        return this._protocols;
    }

    get icons(): string[] {
        return this._icons;
    }

    get onSave$(): Subject<ImageInput> {
        return this._onSave$;
    }

    get title(): string {
        return this._title;
    }

    constructor(dialogRef: MatDialogRef<ImageEditComponent>,
                @Inject(MAT_DIALOG_DATA) {image},
                apollo: Apollo) {
        this._dialogRef = dialogRef;
        this._apollo = apollo;

        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            version: new FormControl(null, Validators.required),
            icon: new FormControl('data-analysis-1.jpg', Validators.required),
            visible: new FormControl(false, Validators.required),
            networks: new FormControl(null, Validators.required),
            cloudImage: new FormControl(),
            description: new FormControl(null),
            protocols: new FormControl(null),
            autologin: new FormControl(null),
            bootCommand: new FormControl(null),
        });
        if (image) {
            this._setTitle(`Edit image`);
            this._createFormFromImage(image);
        } else {
            this._setTitle(`Create image`);
        }

    }


    public compareImage(image1: Image, image2: Image): boolean {
        return image1.id === image2.id;
    }

    private _setTitle(title: string): void {
        this._title = title;
    }

    private _createFormFromImage(image: Image): void {
        const {
            name,
            version,
            icon,
            visible,
            networks,
            cloudImage,
            description,
            protocols,
            autologin,
            bootCommand
        } = image;
        this.form.reset({
            name,
            version,
            icon,
            visible,
            networks: networks.map(network => network.cloudNetwork),
            protocols,
            autologin,
            bootCommand,
            description,
            cloudImage
        });
    }

    public ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                    query {
                      imageProtocols {
                        id
                        name
                      }
                      cloudImages {
                        id
                        name
                      }
                      cloudNetworks {
                        id
                        name
                      }
                    }
            `
        }).pipe(
            map(({data}) => ({
                    protocols: data.imageProtocols,
                    cloudImages: data.cloudImages,
                    cloudNetworks: data.cloudNetworks
                })
            ),
            takeUntil(this._destroy$)
        ).subscribe(({protocols, cloudImages, cloudNetworks}) => {
            this._protocols = protocols;
            this._cloudImages = cloudImages;
            this._cloudNetworks = cloudNetworks;
        });


    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const {name, version, icon, cloudImage, visible, networks, description, protocols, autologin, bootCommand} = this.form.value;
        const input = {
            name,
            version,
            description,
            icon,
            computeId: cloudImage.id,
            visible,
            protocolIds: protocols.map(protocol => protocol.id),
            networkIds: networks.map(network => network.id),
            bootCommand,
            autologin
        };
        this._onSave$.next(input);
    }


}
