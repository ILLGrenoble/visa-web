import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {CloudClient, CloudImage, Image, ImageInput, ImageProtocol} from '../../../core/graphql';
import gql from 'graphql-tag';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';

@Component({
    selector: 'visa-admin-image-edit',
    templateUrl: './image-edit.component.html',
})
export class ImageEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _icons = ['data-analysis-1.jpg', 'data-analysis-2.jpg', 'data-analysis-3.jpg'];
    private _cloudClients: CloudClient[];
    private _cloudImages: CloudImage[] = [];
    private _protocols: ImageProtocol[] = [];
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<ImageInput> = new Subject<ImageInput>();
    private _multiCloudEnabled = false;

    constructor(private readonly _dialogRef: MatDialogRef<ImageEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {image, clone}) {

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());

        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            version: new FormControl(null, Validators.required),
            icon: new FormControl('data-analysis-1.jpg', Validators.required),
            visible: new FormControl(false, Validators.required),
            cloudClient: new FormControl(null, Validators.required),
            cloudImage: new FormControl(null, Validators.required),
            description: new FormControl(null),
            protocols: new FormControl(null),
            autologin: new FormControl(null),
            bootCommand: new FormControl(null),
            defaultVdiProtocol: new FormControl(null, Validators.required),
            secondaryVdiProtocol: new FormControl(null, this._secondaryVdiProtocolValidator.bind(this)),
        });

        this._form.get('defaultVdiProtocol')?.valueChanges.subscribe(() => {
            this._form.get('secondaryVdiProtocol')?.updateValueAndValidity();
        });

        this._form.get('protocols')?.valueChanges.subscribe(protocols => {
            const availableGuacamoleProtocols = protocols.filter(protocol => ['RDP', 'VNC'].includes(protocol.name));
            if (availableGuacamoleProtocols.length === 1) {
                this._form.controls.secondaryVdiProtocol.setValue(availableGuacamoleProtocols[0]);
            }
            if (availableGuacamoleProtocols.length === 0) {
                this._form.controls.secondaryVdiProtocol.setValue(null);
            }
        });

        if (image) {
            if (clone) {
                this._title = `Clone image`;
            } else {
                this._title = `Edit image`;
            }
            this._createFormFromImage(image);
        } else {
            this._title = `Create image`;
        }

    }

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get cloudClients(): CloudClient[] {
        return this._cloudClients;
    }

    get cloudImages(): CloudImage[] {
        return this._cloudImages;
    }

    get protocols(): ImageProtocol[] {
        return this._protocols;
    }

    get availableVdiProtocols(): ImageProtocol[] {
        const selectedProtocols = this._form?.value.protocols || [];
        return selectedProtocols.filter(protocol => ['GUACD', 'WEBX'].includes(protocol.name));
    }

    get availableGuacamoleProtocols(): ImageProtocol[] {
        const selectedProtocols = this._form?.value.protocols || [];
        return selectedProtocols.filter(protocol => ['RDP', 'VNC'].includes(protocol.name));
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

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    public isGuacamoleAvailable(): boolean {
        return this.availableVdiProtocols.map(protocol => protocol.name).includes('GUACD');
    }

    public compareCloudClient(cloudClient1: CloudClient, cloudClient2: CloudClient): boolean {
        if (cloudClient1 == null || cloudClient2 == null) {
            return false;
        }
        return cloudClient1.id === cloudClient2.id;
    }

    public compareCloudImage(image1: CloudImage, image2: CloudImage): boolean {
        if (image1 == null || image2 == null) {
            return false;
        }
        return image1.id === image2.id;
    }

    public compareProtocol(protocol1: ImageProtocol, protocol2: ImageProtocol): boolean {
        if (protocol1 == null || protocol2 == null) {
            return false;
        }
        return protocol1.id === protocol2.id;
    }

    private _createFormFromImage(image: Image): void {
        const {
            name,
            version,
            icon,
            visible,
            cloudClient,
            cloudImage,
            description,
            protocols,
            defaultVdiProtocol,
            secondaryVdiProtocol,
            autologin,
            bootCommand
        } = image;
        this.form.reset({
            name,
            version,
            icon,
            visible,
            protocols,
            defaultVdiProtocol,
            secondaryVdiProtocol,
            autologin,
            bootCommand,
            description,
            cloudClient,
            cloudImage
        });

        if (secondaryVdiProtocol == null && this.isGuacamoleAvailable()) {
            if (this.availableGuacamoleProtocols.length === 1) {
                this._form.controls.secondaryVdiProtocol.setValue(this.availableGuacamoleProtocols[0]);
            }
        }

        // Initialise cloud flavours with current cloud flavour
        this._cloudImages = [null, cloudImage];
    }

    public ngOnInit(): void {
        this._apollo.query<any>({
            query: gql`
                    query {
                      imageProtocols {
                        id
                        name
                      }
                      cloudClients {
                        id
                        name
                      }
                    }
            `
        }).pipe(
            map(({data}) => ({
                    protocols: data.imageProtocols,
                    cloudClients: data.cloudClients,
                })
            ),
            takeUntil(this._destroy$)
        ).subscribe(({protocols, cloudClients}) => {
            this._protocols = protocols;
            this._cloudClients = cloudClients;
            this._multiCloudEnabled = cloudClients.length > 1;

            if (this._form.value.cloudClient == null) {
                this.form.controls.cloudClient.reset(this._cloudClients[0]);
                this._loadCloudImages(this._cloudClients[0].id);

            } else {
                this._loadCloudImages(this._form.value.cloudClient.id, this._form.value.cloudImage);
            }
        });

    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCloudChange(): void {
        this._loadCloudImages(this._form.value.cloudClient.id);
        this.form.controls.cloudImage.reset();
    }

    private _loadCloudImages(cloudId: number, selectedCloudImage?: CloudImage): void {

        this._apollo.query<any>({
            query: gql`
                query cloudImages($cloudId: Int!) {
                    cloudImages(cloudId: $cloudId) {
                        id
                        name
                    }
                }
            `,
            variables: { cloudId },
        }).pipe(
            map(({data}) => (data.cloudImages)),
        ).subscribe((cloudImages) => {
            cloudImages = cloudImages || [];
            cloudImages.unshift(null);
            this._cloudImages = cloudImages;
            this.form.controls.cloudImage.reset(selectedCloudImage);
        });
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const {name, version, icon, cloudClient, cloudImage, visible, description, protocols, defaultVdiProtocol, secondaryVdiProtocol, autologin, bootCommand} = this.form.value;
        const input = {
            name,
            version,
            description,
            icon,
            cloudId: cloudClient.id,
            computeId: cloudImage.id,
            visible,
            protocolIds: protocols.map(protocol => protocol.id),
            defaultVdiProtocolId: defaultVdiProtocol.id,
            secondaryVdiProtocolId: secondaryVdiProtocol?.id,
            bootCommand,
            autologin
        } as ImageInput;
        this._onSave$.next(input);
    }

    private _secondaryVdiProtocolValidator(control: FormControl): { [key: string]: boolean } | null {
        if (this.isGuacamoleAvailable() && !control.value) {
            return { required: true };
        }
        return null;
    }
}
