import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Role, User, UserInput} from '../../../core/graphql';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import {NotifierService} from "angular-notifier";

@Component({
    selector: 'visa-admin-user-edit',
    templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _form: FormGroup;
    private _userId: string;

    private _minDate: string;
    private _userGroups: Role[];

    private _modalData$: Subject<{user: User}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();


    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ user: User }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<void> {
        return this._onSave$;
    }

    public get form(): FormGroup {
        return this._form;
    }

    get showGuestExpiryDate(): boolean {
        return this._form.value.guest === true;
    }

    get minDate(): string {
        return this._minDate;
    }

    get userGroups(): Role[] {
        return this._userGroups;
    }

    constructor(private _apollo: Apollo,
                private readonly _notifierService: NotifierService) {

        this._form = new FormGroup({
            instanceQuota: new FormControl(null, Validators.required),
            admin: new FormControl(null),
            guest: new FormControl(null),
            guestExpiresAt:  new FormControl(null),
            userGroups: new FormControl(null),
        });
    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {user} = data;
            this._userId = user.id;

            const now = new Date();
            this._minDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

            this._createFormFromUser(user);
            this._showEditModal = true;
        });

        this._apollo.query<any>({
            query: gql`
               query groups {
                     groups {
                        id
                        name
                    }
                }
            `
        }).pipe(
            map(({data}) => ({userGroups: data.groups})),
            takeUntil(this._destroy$),
        ).subscribe(({userGroups}) => {
            this._userGroups = userGroups || [];
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    private _createFormFromUser(user: User): void {
        const {instanceQuota, activeUserRoles, groups} = user;
        const admin = activeUserRoles.find(userRole => userRole.role.name === 'ADMIN') != null;
        const guestRole = activeUserRoles.find(userRole => userRole.role.name === 'GUEST');
        const guest = guestRole != null;
        const guestRoleExpiresAtDate = guestRole != null && guestRole.expiresAt != null ? new Date(guestRole.expiresAt) : null;

        const guestRoleExpiresAt = guestRoleExpiresAtDate == null ? null : `${guestRoleExpiresAtDate.getDate()}/${guestRoleExpiresAtDate.getMonth() + 1}/${guestRoleExpiresAtDate.getFullYear()}`;

        this._form.reset({
            instanceQuota,
            admin,
            guest,
            guestExpiresAt: guestRoleExpiresAt,
            userGroups: [...groups],
        });
    }

    public onCancel(): void {
        this._showEditModal = false;
    }

    public submit(): void {

        const {instanceQuota, admin, guest, guestExpiresAt, userGroups} = this._form.value;

        let guestExpiresAtDate = null;
        if (guest && guestExpiresAt != null && guestExpiresAt !== '') {
            const guestExpiresAtComponents = guestExpiresAt.split('/');
            guestExpiresAtDate = `${guestExpiresAtComponents[2]}-${guestExpiresAtComponents[1]}-${guestExpiresAtComponents[0]} 09:00`;
        }
        const input = {
            instanceQuota,
            admin,
            guest,
            guestExpiresAt: guestExpiresAtDate,
            groupIds: userGroups ? userGroups.map(role => role.id) : [],
        } as UserInput;

        this._apollo.mutate({
            mutation: gql`
              mutation updateUser($id: String!, $input: UserInput!) {
                updateUser(id: $id, input: $input) {
                  id
                }
              }
            `,
            variables: {
                id: this._userId,
                input
            },
        }).subscribe(() => {
            this._notifierService.notify('success', 'Updated user successfully');
            this._showEditModal = false;
            this._onSave$.next();
        });
    }

}
