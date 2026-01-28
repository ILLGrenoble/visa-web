import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
    CloudClient,
    CloudClientInput,
    OpenStackProviderConfigurationInput,
    WebProviderConfigurationInput
} from '../../../core/graphql';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Apollo} from 'apollo-angular';
import {NotifierService} from "angular-notifier";
import {takeUntil} from "rxjs/operators";
import gql from "graphql-tag";

@Component({
    selector: 'visa-admin-cloud-client-edit',
    templateUrl: './cloud-client-edit.component.html',
    styleUrls: ['./cloud-client-edit.component.scss'],
})
export class CloudClientEditComponent implements OnInit, OnDestroy {

    private _clientForm: FormGroup;
    private _openStackForm: FormGroup;
    private _webForm: FormGroup;
    private _title: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _readonly: boolean;
    private _providerTypes = [{value: 'openstack', name: 'OpenStack'}, {value: 'web', name: 'Web'}];

    private _cloudClientId: number;
    private _modalData$: Subject<{cloudClient: CloudClient, clone: boolean, readonly: boolean}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();

    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ cloudClient: CloudClient, clone: boolean, readonly: boolean }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<void> {
        return this._onSave$;
    }

    get clientForm(): FormGroup {
        return this._clientForm;
    }

    get openStackForm(): FormGroup {
        return this._openStackForm;
    }

    get openStackAddressProviderUUIDsForm(): FormArray {
        return this._openStackForm.get('addressProviderUUIDs') as FormArray;
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

    get title(): string {
        return this._title;
    }

    get providerType(): string {
        return this._clientForm.value.type;
    }

    get readonly(): boolean {
        return this._readonly;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _formBuilder: FormBuilder) {

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
            // addressProviderUUID: new FormControl(null, Validators.required),
            addressProviderUUIDs: this._formBuilder.array([
                new FormControl(null, Validators.required)
            ]),
        });

        this._webForm = new FormGroup({
            url: new FormControl(null, Validators.required),
            authToken: new FormControl(null, Validators.required),
        });
    }

    ngOnInit() {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {cloudClient, clone, readonly} = data;

            this._readonly = readonly;
            this._cloudClientId = null;

            if (cloudClient) {
                if (clone) {
                    this._title = `Clone cloud provider`;

                } else if (readonly) {
                    this._title = `Cloud provider details`;

                } else {
                    this._cloudClientId = cloudClient.id;
                    this._title = `Edit cloud provider`;
                }
                this._createFormFromCloudClient(cloudClient);

            } else {
                this._title = `Create cloud provider`;
                this._resetForm();
            }
            this._showEditModal = true;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
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

            const addressProviderUUIDs = addressProvider  == null ? [] : addressProviderUUID.split(',');

            this._openStackForm.reset({
                applicationId,
                applicationSecret,
                computeEndpoint,
                placementEndpoint,
                imageEndpoint,
                networkEndpoint,
                identityEndpoint,
                addressProvider,
            });

            this.openStackAddressProviderUUIDsForm.clear();
            for (const addressProviderUUID of addressProviderUUIDs) {
                this.openStackAddressProviderUUIDsForm.push(new FormControl(addressProviderUUID, Validators.required))
            }

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

    private _resetForm(): void {
        this._clientForm.reset({
            type: null,
            name: null,
            serverNamePrefix: null,
            visible: null,
        });
        this._openStackForm.reset({
            applicationId: null,
            applicationSecret: null,
            computeEndpoint: null,
            placementEndpoint: null,
            imageEndpoint: null,
            networkEndpoint: null,
            identityEndpoint: null,
            addressProvider: null,
        });
        this.openStackAddressProviderUUIDsForm.clear();
        this._clientForm.reset({
            url: null,
            authToken: null,
        });
    }

    public onCancel(): void {
        this._showEditModal = false;
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
            addressProviderUUIDs,
        } = this._openStackForm.value;
        const { url, authToken } = this._webForm.value;

        const addressProviderUUID = addressProviderUUIDs.join(',');

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
        this._saveCloudClient(input);
    }

    private _saveCloudClient(input: CloudClientInput): void {
        if (this._cloudClientId == null) {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation CreateCloudClient($input: CloudClientInput!){
                        createCloudClient(input: $input) {
                            id
                        }
                    }
                `,
                variables: {input},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Cloud provider created');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            })

        } else {
            this._apollo.mutate<any>({
                mutation: gql`
                mutation UpdateCloudClient($id: Int!,$input: CloudClientInput!){
                    updateCloudClient(id: $id, input: $input) {
                        id
                    }
                }
                `,
                variables: {id: this._cloudClientId, input},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Cloud provider saved');
                    this._showEditModal = false;
                    this._onSave$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            })
        }
    }

    addAddressProviderUUID(): void {
        this.openStackAddressProviderUUIDsForm.push(
            this._formBuilder.control('', Validators.required)
        );
    }

    removeAddressProviderUUID(index: number): void {
        this.openStackAddressProviderUUIDsForm.removeAt(index);
    }
}
