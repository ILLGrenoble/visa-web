import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {Apollo} from 'apollo-angular';
import {map, takeUntil} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {
    ApplicationCredential,
    ApplicationCredentialDetail,
} from '../../../core/graphql';
import {Title} from '@angular/platform-browser';

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

    private _modalData$ = new Subject<{ applicationCredential: ApplicationCredentialDetail }>();
    private _applicationCredentialToDelete: ApplicationCredentialDetail;

    get createdApplicationCredential(): ApplicationCredential {
        return this._createdApplicationCredential;
    }

    get modalData$(): Subject<{ applicationCredential: ApplicationCredentialDetail }> {
        return this._modalData$;
    }

    get showDeleteModal(): boolean {
        return this._applicationCredentialToDelete != null;
    }

    get applicationCredentialToDelete(): ApplicationCredentialDetail {
        return this._applicationCredentialToDelete;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService,
                private titleService: Title) {
    }

    public ngOnInit(): void {
        this.titleService.setTitle(`Application Credentials | Settings | Admin | VISA`);
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
                        lastUsedAt
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
        this.modalData$.next({applicationCredential: null});
    }

    public onDelete(applicationCredential: ApplicationCredentialDetail): void {
        this._applicationCredentialToDelete = applicationCredential;
    }

    public onConfirmDelete(): void {
        if (this._applicationCredentialToDelete) {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation deleteApplicationCredential($id: Int!){
                        deleteApplicationCredential(id:$id) {
                            id
                        }
                    }
                `,
                variables: {id: this._applicationCredentialToDelete.id},
            }).subscribe({
                next:() => {
                    this._applicationCredentialToDelete = null;
                    this.notifierService.notify('success', 'Application Credentials deleted');
                    this.loadApplicationCredentials();
                },
                error: (error) => {
                    this.notifierService.notify('error', error);
                }
            });
        }
    }

    public onDeleteModalClosed(): void {
        this._applicationCredentialToDelete = null;
    }

    public onUpdate(applicationCredential: ApplicationCredentialDetail): void {
        this.modalData$.next({applicationCredential: applicationCredential});
    }

    public onApplicationCredentialSaved(createdApplicationCredential: ApplicationCredential): void {
        this.loadApplicationCredentials();
        this._createdApplicationCredential = createdApplicationCredential;
    }


    public copyToClipboard(text: string): void {
        if (!navigator.clipboard) {
            this.fallbackCopyTextToClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            this.notifierService.notify('success', 'Value copied to clipboard');
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

}
