import {Component, EventEmitter, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Instance, InstanceExtensionRequest, InstanceExtensionResponseInput} from '../../../core/graphql';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import * as moment from 'moment';
import {ApplicationState, selectLoggedInUser, User as CoreUser} from '../../../core';
import {filter, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';

@Component({
    selector: 'visa-admin-extension-request-handler',
    styleUrls: ['./extension-request-handler.component.scss'],
    templateUrl: './extension-request-handler.component.html',
})
export class ExtensionRequestHandlerComponent implements OnInit {

    private _user: CoreUser;

    private _onHandled$: EventEmitter<any> = new EventEmitter();

    private readonly _extensionRequest: InstanceExtensionRequest;
    private readonly _instance: Instance;

    private _form: UntypedFormGroup;
    private _accepted: boolean = null;
    private _terminationDate: Date;
    private _minDate: string;

    get onHandled$(): EventEmitter<any> {
        return this._onHandled$;
    }

    get extensionRequest(): InstanceExtensionRequest {
        return this._extensionRequest;
    }

    get instance(): Instance {
        return this._instance;
    }

    get form(): UntypedFormGroup {
        return this._form;
    }

    get accepted(): boolean {
        return this._accepted;
    }

    set accepted(value: boolean) {
        this._accepted = value;
    }

    get minDate(): string {
        return this._minDate;
    }

    get terminationDate(): Date {
        return this._terminationDate;
    }

    set terminationDate(value: Date) {
        const hours = this._terminationDate.getHours();
        const minutes = this._terminationDate.getMinutes();
        this._terminationDate = value;
        value.setHours(hours);
        value.setMinutes(minutes);
    }

    constructor(private dialogRef: MatDialogRef<ExtensionRequestHandlerComponent>,
                private store: Store<ApplicationState>,
                @Inject(MAT_DIALOG_DATA) data) {
        this._extensionRequest = data.request;
        this._instance = this._extensionRequest.instance;
        this._terminationDate = new Date(this._instance.terminationDate);
        this._minDate = `${this._terminationDate.getFullYear()}-${this._terminationDate.getMonth() + 1}-${this._terminationDate.getDate()}`;
        store.select(selectLoggedInUser).pipe(filter(user => !!user), take(1)).subscribe((user: CoreUser) => {
            this._user = user;
        });
    }

    public ngOnInit(): void {
        this.createForm();
        this.dialogRef.keydownEvents().pipe(filter(event => event.key === 'Escape')).subscribe(_ => this.dialogRef.close());
        this.dialogRef.backdropClick().subscribe(_ => this.dialogRef.close());
    }

    public isAcceptedValue(value: boolean): boolean {
        return this._accepted === value;
    }

    public setAcceptedValue(value: boolean): void {
        this._accepted = value;
    }

    private createForm(): void {
        this._form = new UntypedFormGroup({
            handlerCommentsRefused: new UntypedFormControl('', Validators.compose([Validators.maxLength(4000), Validators.required])),
            handlerCommentsAccepted: new UntypedFormControl('', Validators.maxLength(4000)),
        });
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

    public isValid(): boolean {
        if (this._accepted === null) {
            return false;

        } else if (this._accepted === true) {
            return this._form.get('handlerCommentsAccepted').valid;

        } else {
            return this._form.get('handlerCommentsRefused').valid;
        }
    }

    public onCancel(): void {
        this.dialogRef.close();
    }

    public submit(): void {
        const {handlerCommentsRefused, handlerCommentsAccepted} = this._form.value;
        const dateString = moment(this._terminationDate).format('YYYY-MM-DD HH:mm');
        const response = {
            handlerId: this._user.id,
            handlerComments: this._accepted ? handlerCommentsAccepted : handlerCommentsRefused,
            accepted: this._accepted,
            terminationDate: dateString,
        } as InstanceExtensionResponseInput;
        this._onHandled$.emit(response);
    }

}
