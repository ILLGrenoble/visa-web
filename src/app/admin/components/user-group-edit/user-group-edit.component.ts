import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {filter, map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {lastValueFrom, Subject} from 'rxjs';
import {
    Flavour,
    Role, RoleInput,
} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';


@Component({
    selector: 'visa-admin-user-group-edit',
    templateUrl: './user-group-edit.component.html'
})
export class UserGroupEditComponent implements OnDestroy {

    private _form: FormGroup;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private readonly _title: string;
    private readonly _role: Role;

    get form(): FormGroup {
        return this._form;
    }

    set form(value: FormGroup) {
        this._form = value;
    }

    get title(): string {
        return this._title;
    }

    constructor(private readonly _dialogRef: MatDialogRef<UserGroupEditComponent>,
                private readonly _apollo: Apollo,
                @Inject(MAT_DIALOG_DATA) {role},
                private readonly _notifierService: NotifierService) {

        this._dialogRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this._dialogRef.close();
            }
        });
        this._dialogRef.backdropClick().subscribe(_ => this._dialogRef.close());

        this._form = new FormGroup({
            name: new FormControl(null, Validators.required),
            description: new FormControl(null),
        });

        if (role) {
            this._role = role;
            this._title = 'Edit user group';
            this._createFormFromRole(role);

        } else {
            this._title = 'Create user group';
        }
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
            if (rolesAndGroups.find(role => role.name === name && role.id !== this._role.id)) {
                this._notifierService.notify('warning', `A role or group with this name already exists`);

            } else {
                if (this._role) {
                    this.updateRole(this._role.id, name, description);

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

        const source$ = this._apollo.mutate({
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
        );
        lastValueFrom(source$).then(() => {
            this._notifierService.notify('success', 'Successfully created new user group');
            this._dialogRef.close(true);
        }).catch((error) => {
            this._notifierService.notify('error', error);
        });
    }

    private updateRole(id: number, name: string, description: string): void {
        const input = {
            name,
            description,
        } as RoleInput;

        const source$ = this._apollo.mutate({
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
        );
        lastValueFrom(source$).then(() => {
            this._notifierService.notify('success', 'Successfully updated user group');
            this._dialogRef.close(true);
        }).catch((error) => {
            this._notifierService.notify('error', error);
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCancel(): void {
        this._dialogRef.close();
    }

}
