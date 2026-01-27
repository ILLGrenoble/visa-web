import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {Role, RoleInput} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';


@Component({
    selector: 'visa-admin-user-group-edit',
    templateUrl: './user-group-edit.component.html'
})
export class UserGroupEditComponent implements OnInit, OnDestroy {

    private _form: FormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _title: string;

    private _roleId: number;
    private _modalData$: Subject<{role: Role}>;
    private _showEditModal = false;
    private _onSave$: EventEmitter<void> = new EventEmitter<void>();

    get showEditModal(): boolean {
        return this._showEditModal;
    }

    set showEditModal(value: boolean) {
        this._showEditModal = value;
    }

    @Input()
    set modalData$(value: Subject<{ role: Role }>) {
        this._modalData$ = value;
    }

    @Output()
    get onSave(): EventEmitter<void> {
        return this._onSave$;
    }

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get title(): string {
        return this._title;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService) {
        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            description: new FormControl(null),
        });

    }

    public ngOnInit(): void {
        this._modalData$.pipe(
            takeUntil(this._destroy$),
        ).subscribe(data => {
            const {role} = data;

            if (role) {
                this._roleId = role.id;
                this._title = 'Edit user group';
                this._createFormFromRole(role);

            } else {
                this._roleId = null;
                this._title = 'Create user group';
                this._resetForm();
            }

            this._showEditModal = true;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    private _createFormFromRole(role: Role): void {
        const {
            name,
            description,
        } = role;
        this.form.reset({
            name,
            description
        });
    }

    private _resetForm(): void {
        this.form.reset({
            name: null,
            description: null
        });
    }

    submit(): void {
        const {name, description} = this.form.value;
        this._apollo.query<any>({
            query: gql`
               query rolesAndGroups {
                     rolesAndGroups {
                        id
                        name
                    }
                }
            `
        }).pipe(
            map(({data}) => ({rolesAndGroups: data.rolesAndGroups})),
            takeUntil(this._destroy$),
        ).subscribe(({rolesAndGroups}) => {
            if (rolesAndGroups.find(role => role.name === name && role.id !== this._roleId)) {
                this._notifierService.notify('warning', `A role or group with this name already exists`);

            } else {
                if (this._roleId) {
                    this.updateRole(this._roleId, name, description);

                } else {
                    this.createRole(name, description);
                }
            }
        });
    }

    private createRole(name: string, description: string): void {
        const input = {
            name,
            description,
        } as RoleInput;

         this._apollo.mutate({
            mutation: gql`
                mutation CreateRole($input: RoleInput!){
                  createRole(input: $input) {
                    id
                    name
                    description
                  }
                }
            `,
            variables: { input },
        }).pipe(
            takeUntil(this._destroy$)
        ).subscribe({
             next: () => {
                 this._notifierService.notify('success', 'Successfully created new user group');
                 this._showEditModal = false;
                 this._onSave$.next();
             },
             error: (error) => {
                 this._notifierService.notify('error', error);
             }
         });
    }

    private updateRole(id: number, name: string, description: string): void {
        const input = {
            name,
            description,
        } as RoleInput;

        this._apollo.mutate({
            mutation: gql`
                mutation UpdateRole($id: Int!, $input: RoleInput!){
                  updateRole(id: $id, input: $input) {
                    id
                    name
                    description
                  }
                }
            `,
            variables: {id,  input },
        }).pipe(
            takeUntil(this._destroy$)
        ).subscribe({
            next: () => {
                this._notifierService.notify('success', 'Successfully updated user group');
                this._showEditModal = false;
                this._onSave$.next();
            },
            error: (error) => {
                this._notifierService.notify('error', error);
            }
        });
    }

    public onCancel(): void {
        this._showEditModal = false;
    }

}
