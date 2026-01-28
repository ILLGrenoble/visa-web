import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
    ApplicationCredential, ApplicationCredentialDetail,
    ApplicationCredentialInput,
} from '../../../core/graphql';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Subject} from "rxjs";
import gql from "graphql-tag";
import {Apollo} from "apollo-angular";
import {NotifierService} from "angular-notifier";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Component({
    selector: 'visa-admin-application-credential-edit',
    styleUrls: ['./application-credential-edit.component.scss'],
    templateUrl: './application-credential-edit.component.html',
})
export class ApplicationCredentialEditComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _applicationCredentialInput: ApplicationCredentialInput = {
        name: null,
    };
    private _title: string;

    private _applicationCredentialId: number;
    private _modalData$: Subject<{applicationCredential: ApplicationCredentialDetail}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<ApplicationCredential> = new EventEmitter<ApplicationCredential>();


    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ applicationCredential: ApplicationCredentialDetail }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<ApplicationCredential> {
        return this._onSave$;
    }

    get applicationCredentialInput(): ApplicationCredentialInput {
        return this._applicationCredentialInput;
    }

    get title(): string {
        return this._title;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {applicationCredential} = data;

            if (applicationCredential) {
                this._title = `Edit application credential`;
                this._applicationCredentialId = applicationCredential.id;
                this._applicationCredentialInput = {
                    name: applicationCredential.name,
                };

            } else {
                this._title = `Create application credential`;
                this._applicationCredentialId = null;
                this._applicationCredentialInput = {
                    name: null,
                };
            }
            this._showEditModal = true;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCancel(): void {
        this._showEditModal = false;
    }

    public submit(): void {
        if (this._applicationCredentialId != null) {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation updateApplicationCredential($id: Int!,$input: ApplicationCredentialInput!){
                        updateApplicationCredential(id:$id, input:$input) {
                            id
                        }
                    }
            `,
                variables: {id: this._applicationCredentialId, input: this._applicationCredentialInput},
            }).subscribe({
                next: () => {
                    this._showEditModal = false;
                    this._notifierService.notify('success', 'Application Credentials updated');
                    this._onSave$.next(null);
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });

        } else {
            this._apollo.mutate<any>({
                mutation: gql`
                    mutation createApplicationCredential($input: ApplicationCredentialInput!){
                        createApplicationCredential(input:$input) {
                          id
                          name
                          applicationId
                          applicationSecret
                        }
                    }
                `,
                variables: {input: this._applicationCredentialInput},
            }).subscribe({
                next: (data: any) => {
                    this._showEditModal = false;
                    this._notifierService.notify('success', 'Application Credentials created');
                    this._onSave$.next(data.data.createApplicationCredential);
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }

    }

}
