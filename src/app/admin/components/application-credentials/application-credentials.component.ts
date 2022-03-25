import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {map, takeUntil} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {ApplicationCredential, ApplicationCredentialDetail, ApplicationCredentialInput} from '../../../core/graphql';
import {ApplicationCredentialNewComponent} from '../application-credential-new';
import {ApplicationCredentialDeleteComponent} from '../application-credential-delete';
import {ApplicationCredentialUpdateComponent} from '../application-credential-update';

@Component({
    selector: 'visa-admin-application-credentials',
    styleUrls: ['./application-credentials.component.scss'],
    templateUrl: './application-credentials.component.html',
})

export class ApplicationCredentialsComponent implements OnInit, OnDestroy {

    public applicationCredentials: ApplicationCredentialDetail[] = [];
    public loading: boolean;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _createdApplicationCredential: ApplicationCredential;

    get createdApplicationCredential(): ApplicationCredential {
        return this._createdApplicationCredential;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this._createdApplicationCredential = null;
        this.loadApplicationCredentials();
    }

    public ngOnDestroy(): void {
        this._createdApplicationCredential = null;

        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadApplicationCredentials();
    }

    public loadApplicationCredentials(): void {
        this._createdApplicationCredential = null;

        this.loading = true;

        this.apollo.query<any>({
            query: gql`
                query All {
                    applicationCredentials {
                        id
                        name
                        applicationId
                    }
                }
            `,
        }).pipe(
            map(({data}) => ({applicationCredentials: data.applicationCredentials})),
            takeUntil(this._destroy$)
        ).subscribe(({applicationCredentials}) => {
            this.applicationCredentials = applicationCredentials;
            this.loading = false;
        });
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(ApplicationCredentialNewComponent, {
            width: '600px',
        });
        dialogRef.componentInstance.onCreate$.subscribe((applicationCredentialInput: any) => {
            this.apollo.mutate<any>({
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
                variables: {input: applicationCredentialInput},
            }).toPromise()
                .then((data: any) => {
                    dialogRef.close();
                    this.loadApplicationCredentials();

                    this.showSuccessNotification('Application Credentials created');
                    this._createdApplicationCredential = data.data.createApplicationCredential;
                }).catch((error) => {
                this.showErrorNotification(error);
            });
        });
    }

    public onDelete(applicationCredential: ApplicationCredentialDetail): void {
        const dialogRef = this.dialog.open(ApplicationCredentialDeleteComponent, {
            width: '600px', data: applicationCredential,
        });
        dialogRef.componentInstance.onDelete$.subscribe(() => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation deleteApplicationCredential($id: Int!){
                        deleteApplicationCredential(id:$id) {
                            id
                        }
                    }
                `,
                variables: {id: applicationCredential.id},
            }).toPromise()
                .then(() => {
                    this.showSuccessNotification('Application Credentials deleted');
                    this.loadApplicationCredentials();
                });
        });
    }

    public onUpdate(applicationCredential: ApplicationCredentialDetail): void {
        const applicationCredentialToUpdate: ApplicationCredentialInput = {
            name: applicationCredential.name,
        };

        const dialogRef = this.dialog.open(ApplicationCredentialUpdateComponent, {
            width: '900px', data: applicationCredentialToUpdate,
        });
        dialogRef.componentInstance.onUpdate$.subscribe(async (data) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation updateApplicationCredential($id: Int!,$input: ApplicationCredentialInput!){
                        updateApplicationCredential(id:$id, input:$input) {
                            id
                        }
                    }
            `,
                variables: {id: applicationCredential.id, input: data},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.showSuccessNotification('Application Credentials updated');
                    this.loadApplicationCredentials();
                }).catch((error) => {
                this.showErrorNotification(error);
            });
        });
    }

    public copyToClipboard(text: string): void {
        if (!navigator.clipboard) {
            this.fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccessNotification('Value copied to clipboard');
        }, () => {
            console.error('Failed to copy value to clipboard:');
        });

    }

    private fallbackCopyTextToClipboard(text: string): void {
        const textArea = document.createElement('textarea');
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    }

    private showSuccessNotification(message): void {
        this.notifierService.notify('success', message);
    }

    private showErrorNotification(message): void {
        this.notifierService.notify('error', message);
    }
}
