import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ApplicationCredentialInput} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-application-credential-new',
    styleUrls: ['./application-credential-new.component.scss'],
    templateUrl: './application-credential-new.component.html',
})
export class ApplicationCredentialNewComponent implements OnInit {

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

    constructor(private _dialogRef: MatDialogRef<ApplicationCredentialNewComponent>,
                @Inject(MAT_DIALOG_DATA) private _data) {
    }

    public ngOnInit(): void {
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

    public submit(): void {
        this._onCreate$.emit(this._applicationCredentialInput);
    }

}
