import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
    FlavourAvailabilitiesFuture,
    Instance,
    InstanceExtensionRequest,
    InstanceExtensionResponseInput
} from '../../../core/graphql';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import * as moment from 'moment';
import {ApplicationState, selectLoggedInUser, User as CoreUser} from '../../../core';
import {filter, map, take, takeUntil} from 'rxjs/operators';
import gql from "graphql-tag";
import {Apollo} from "apollo-angular";
import {Subject} from "rxjs";
import {NotifierService} from "angular-notifier";
import {Store} from "@ngrx/store";

@Component({
    selector: 'visa-admin-extension-request-handler',
    styleUrls: ['./extension-request-handler.component.scss'],
    templateUrl: './extension-request-handler.component.html',
})
export class ExtensionRequestHandlerComponent implements OnInit, OnDestroy {

    private _user: CoreUser;

    private _extensionRequest: InstanceExtensionRequest;
    private _instance: Instance;
    private _availability: FlavourAvailabilitiesFuture = null;

    private _form: FormGroup;
    private _accepted: boolean = null;
    private _terminationDate: Date;
    private _minDate: string;

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _modalData$: Subject<{request: InstanceExtensionRequest}>;
    private _showHandlerModal = false;
    private _onHandled: EventEmitter<void> = new EventEmitter<void>();

    get showHandlerModal(): boolean {
        return this._showHandlerModal;
    }

    set showHandlerModal(value: boolean) {
        this._showHandlerModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ request: InstanceExtensionRequest }>) {
        this._modalData$ = value;
    }

    @Output()
    get onHandled(): EventEmitter<void> {
        return this._onHandled;
    }

    get extensionRequest(): InstanceExtensionRequest {
        return this._extensionRequest;
    }

    get instance(): Instance {
        return this._instance;
    }

    get form(): FormGroup {
        return this._form;
    }

    get handlerCommentsRefused(): AbstractControl {
        return this._form.get('handlerCommentsRefused');
    }

    get handlerCommentsAccepted(): AbstractControl {
        return this._form.get('handlerCommentsAccepted');
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

    get availability(): FlavourAvailabilitiesFuture {
        return this._availability;
    }

    constructor(private apollo: Apollo,
                private _store: Store<ApplicationState>,
                private readonly _notifierService: NotifierService) {

        this._store.select(selectLoggedInUser).pipe(filter(user => !!user), take(1)).subscribe((user: CoreUser) => {
            this._user = user;
        });
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {request} = data;

            this._extensionRequest = request;
            this._accepted = null;
            this._instance = this._extensionRequest.instance;
            this._terminationDate = new Date(this._instance.terminationDate);
            this._minDate = `${this._terminationDate.getFullYear()}-${this._terminationDate.getMonth() + 1}-${this._terminationDate.getDate()}`;
            this._getFlavourAvailabilities(this._instance.plan.flavour.id);
            this.createForm();

            this._showHandlerModal = true;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public isAcceptedValue(value: boolean): boolean {
        return this._accepted === value;
    }

    public setAcceptedValue(value: boolean): void {
        this._accepted = value;
    }

    private createForm(): void {
        this._form = new FormGroup({
            handlerCommentsRefused: new FormControl('', Validators.compose([Validators.maxLength(4000), Validators.required])),
            handlerCommentsAccepted: new FormControl('', Validators.maxLength(4000)),
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
        this._showHandlerModal = false;
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
        this._handleRequest(response);
    }

    private _handleRequest(input: InstanceExtensionResponseInput): void {
        this.apollo.mutate<any>({
                mutation: gql`
                    mutation handleInstanceExtensionRequest($requestId: Int!, $response: InstanceExtensionResponseInput!){
                        handleInstanceExtensionRequest(requestId:$requestId, response:$response) {
                            id
                            comments
                            state
                        }
                    }
                `,
                variables: {requestId: this._extensionRequest.id, response: input},
            }).pipe(
                takeUntil(this._destroy$),
            ).subscribe({
                next: () => {
                    this._notifierService.notify('success', 'Instance extension request has been handled successfully');
                    this._showHandlerModal = false;
                    this._onHandled.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
    }

    private _getFlavourAvailabilities(flavourId: number): void {
        this.apollo.query<any>({
            query: gql`
                query flavourAvailabilitiesFutures($flavourIds: [Int]) {
                    flavourAvailabilitiesFutures(flavourIds: $flavourIds) {
                        flavour {
                            id
                            name
                            memory
                            cpu
                            cloudId
                            devices {
                                devicePool {
                                    id
                                    name
                                    description
                                    resourceClass
                                }
                                unitCount
                            }
                        }
                        confidence
                        availabilities {
                            date
                            confidence
                            availableUnits
                            totalUnits
                            usedUnits
                        }
                    }
                }
            `,
            variables: {
                flavourIds: [flavourId],
            },
        }).pipe(
            map(({data}) => data),
        ).subscribe(({flavourAvailabilitiesFutures}) => {
            this._availability = flavourAvailabilitiesFutures[0];
        });

    }

}
