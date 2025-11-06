import {Component, Inject, OnDestroy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
    CloudClient,
    CloudClientInput,
    OpenStackProviderConfigurationInput,
    WebProviderConfigurationInput
} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-cloud-client-edit',
    templateUrl: './cloud-client-edit.component.html',
})
export class CloudClientEditComponent implements OnDestroy {

    private readonly _clientForm: FormGroup;
    private readonly _openStackForm: FormGroup;
    private readonly _webForm: FormGroup;
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<CloudClientInput> = new Subject<CloudClientInput>();
    private readonly _readonly: boolean;
    private _providerTypes = [{value: 'openstack', name: 'OpenStack'}, {value: 'web', name: 'Web'}];

    constructor(private readonly _dialogRef: MatDialogRef<CloudClientEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {cloudClient, clone, readonly}) {
        this._readonly = readonly;
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());

        this._clientForm = new FormGroup({
            type: new FormControl(null, Validators.required),
            name: new FormControl(null, Validators.required),
            serverNamePrefix: new FormControl(null, Validators.required),
            visible: new FormControl(false, Validators.required),
        });

        this._openStackForm = new FormGroup({
            applicationId: new FormControl(null, Validators.required),
            applicationSecret: new FormControl(null, Validators.required),
            computeEndpoint: new FormControl(null, Validators.required),
            placementEndpoint: new FormControl(null), // optional
            imageEndpoint: new FormControl(null, Validators.required),
            networkEndpoint: new FormControl(null, Validators.required),
            identityEndpoint: new FormControl(null, Validators.required),
            addressProvider: new FormControl(null, Validators.required),
            addressProviderUUID: new FormControl(null, Validators.required),
        });

        this._webForm = new FormGroup({
            url: new FormControl(null, Validators.required),
            authToken: new FormControl(null, Validators.required),
        });

        if (cloudClient) {
            if (clone) {
                this._title = `Clone cloud provider`;
            } else if (readonly) {
                this._title = `Cloud provider details`;
            } else {
                this._title = `Edit cloud provider`;
            }
            this._createFormFromCloudClient(cloudClient);
        } else {
            this._title = `Create cloud provider`;
        }
    }

    get clientForm(): FormGroup {
        return this._clientForm;
    }

    get openStackForm(): FormGroup {
        return this._openStackForm;
    }

    get webForm(): FormGroup {
        return this._webForm;
    }

    get providerFormValid(): boolean {
        switch (this.providerType) {
            case 'openstack':
                return this._openStackForm.valid;
            case 'web':
                return this._webForm.valid;
            default:
                return false;
        }
    }

    get providerTypes(): { name: string; value: string }[] {
        return this._providerTypes;
    }

    get onSave$(): Subject<CloudClientInput> {
        return this._onSave$;
    }

    get title(): string {
        return this._title;
    }

    get providerType(): string {
        return this._clientForm.value.type;
    }

    get readonly(): boolean {
        return this._readonly;
    }

    private _createFormFromCloudClient(cloudClient: CloudClient): void {
        const {
            type,
            name,
            serverNamePrefix,
            visible,
        } = cloudClient;
        this._clientForm.reset({
            type,
            name,
            serverNamePrefix,
            visible
        });

        if (type === 'openstack') {
            const {
                applicationId,
                applicationSecret,
                computeEndpoint,
                placementEndpoint,
                imageEndpoint,
                networkEndpoint,
                identityEndpoint,
                addressProvider,
                addressProviderUUID,
            } = cloudClient.openStackProviderConfiguration;
            this._openStackForm.reset({
                applicationId,
                applicationSecret,
                computeEndpoint,
                placementEndpoint,
                imageEndpoint,
                networkEndpoint,
                identityEndpoint,
                addressProvider,
                addressProviderUUID,
            });
        } else if (type === 'web') {
            const {
                url,
                authToken,
            } = cloudClient.webProviderConfiguration;
            this._webForm.reset({
                url,
                authToken,
            });
        }
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }


    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        const {name, type, serverNamePrefix, visible} = this._clientForm.value;
        const {
            applicationId,
            applicationSecret,
            computeEndpoint,
            placementEndpoint,
            imageEndpoint,
            networkEndpoint,
            identityEndpoint,
            addressProvider,
            addressProviderUUID,
        } = this._openStackForm.value;
        const { url, authToken } = this._webForm.value;
        const input = {
            type,
            name,
            serverNamePrefix,
            visible,
            openStackProviderConfiguration: this.providerType === 'openstack' ? {
                applicationId,
                applicationSecret,
                computeEndpoint,
                placementEndpoint,
                imageEndpoint,
                networkEndpoint,
                identityEndpoint,
                addressProvider,
                addressProviderUUID,
            } as OpenStackProviderConfigurationInput : null,
            webProviderConfiguration: this.providerType === 'web' ? {
                url,
                authToken,
            } as WebProviderConfigurationInput : null,
        } as CloudClientInput;
        this._onSave$.next(input);
    }
}
