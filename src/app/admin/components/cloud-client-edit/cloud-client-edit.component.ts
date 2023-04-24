import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
    CloudClient,
    CloudClientInput,
    OpenStackProviderConfigurationInput,
    WebProviderConfigurationInput
} from '../../../core/graphql';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-cloud-client-edit',
    templateUrl: './cloud-client-edit.component.html',
})
export class CloudClientEditComponent implements OnInit, OnDestroy {

    private readonly _clientForm: UntypedFormGroup;
    private readonly _openStackForm: UntypedFormGroup;
    private readonly _webForm: UntypedFormGroup;
    private readonly _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _onSave$: Subject<CloudClientInput> = new Subject<CloudClientInput>();
    private readonly _readonly: boolean;
    private _providerTypes = [{value: 'openstack', name: 'OpenStack'}, {value: 'web', name: 'Web'}];

    constructor(private readonly _dialogRef: MatDialogRef<CloudClientEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {cloudClient, clone, readonly}) {
        this._readonly = readonly;
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(_ => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());

        this._clientForm = new UntypedFormGroup({
            type: new UntypedFormControl(null, Validators.required),
            name: new UntypedFormControl(null, Validators.required),
            serverNamePrefix: new UntypedFormControl(null, Validators.required),
            visible: new UntypedFormControl(false, Validators.required),
        });

        this._openStackForm = new UntypedFormGroup({
            applicationId: new UntypedFormControl(null, Validators.required),
            applicationSecret: new UntypedFormControl(null, Validators.required),
            computeEndpoint: new UntypedFormControl(null, Validators.required),
            imageEndpoint: new UntypedFormControl(null, Validators.required),
            networkEndpoint: new UntypedFormControl(null, Validators.required),
            identityEndpoint: new UntypedFormControl(null, Validators.required),
            addressProvider: new UntypedFormControl(null, Validators.required),
            addressProviderUUID: new UntypedFormControl(null, Validators.required),
        });

        this._webForm = new UntypedFormGroup({
            url: new UntypedFormControl(null, Validators.required),
            authToken: new UntypedFormControl(null, Validators.required),
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

    get clientForm(): UntypedFormGroup {
        return this._clientForm;
    }

    get openStackForm(): UntypedFormGroup {
        return this._openStackForm;
    }

    get webForm(): UntypedFormGroup {
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

    public ngOnInit(): void {
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
