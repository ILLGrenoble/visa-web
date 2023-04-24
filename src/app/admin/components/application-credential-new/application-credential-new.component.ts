import {Component, EventEmitter, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {ApplicationCredentialInput} from '../../../core/graphql';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-application-credential-new',
    styleUrls: ['./application-credential-new.component.scss'],
    templateUrl: './application-credential-new.component.html',
})
export class ApplicationCredentialNewComponent {

    private _onCreate$: EventEmitter<any> = new EventEmitter();

    private _applicationCredentialInput: ApplicationCredentialInput = {
        name: null,
    };

    get onCreate$(): EventEmitter<any> {
        return this._onCreate$;
    }

    get applicationCredentialInput(): ApplicationCredentialInput {
        return this._applicationCredentialInput;
    }

    constructor(private _dialogRef: MatDialogRef<ApplicationCredentialNewComponent>) {
        this._dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(_ => this._dialogRef.close());
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        this._onCreate$.emit(this._applicationCredentialInput);
    }

}
