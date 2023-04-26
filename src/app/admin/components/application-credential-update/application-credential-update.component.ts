import {Component, EventEmitter, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ApplicationCredentialInput} from '../../../core/graphql';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-application-credential-update',
    styleUrls: ['./application-credential-update.component.scss'],
    templateUrl: './application-credential-update.component.html',
})
export class ApplicationCredentialUpdateComponent {

    private _onUpdate$: EventEmitter<any> = new EventEmitter();

    get onUpdate$(): EventEmitter<any> {
        return this._onUpdate$;
    }

    get applicationCredentialInput(): ApplicationCredentialInput {
        return this._applicationCredential;
    }

    constructor(private _dialogRef: MatDialogRef<ApplicationCredentialUpdateComponent>,
        @Inject(MAT_DIALOG_DATA) private _applicationCredential: ApplicationCredentialInput) {

        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(() => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(() => this._dialogRef.close());
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        this._onUpdate$.emit(this._applicationCredential);
    }

}
