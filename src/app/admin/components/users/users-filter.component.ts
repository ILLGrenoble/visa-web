import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {UsersFilterState} from './users-filter-state';
import {NotifierService} from 'angular-notifier';
import {Role} from "../../../core/graphql";

@Component({
    selector: 'visa-admin-users-filter',
    templateUrl: './users-filter.component.html',
    styleUrls: ['./users-filter.component.scss'],
})
export class UsersFilterComponent implements OnInit, OnDestroy {


    private _state: UsersFilterState;

    private _onState: EventEmitter<UsersFilterState> = new EventEmitter();

    private _form: FormGroup;

    private _roles: Role[];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = true;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    public get state(): UsersFilterState {
        return this._state;
    }

    @Input('state')
    public set state(value: UsersFilterState) {
        this._state = value;
    }

    @Output('onState')
    public get onState(): EventEmitter<UsersFilterState> {
        return this._onState;
    }

    public set onState(value: EventEmitter<UsersFilterState>) {
        this._onState = value;
    }

    public get form(): FormGroup {
        return this._form;
    }

    public set form(value: FormGroup) {
        this._form = value;
    }

    public get roles(): Role[] {
        return this._roles;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(value: boolean) {
        this._loading = value;
    }

    public get activatedUsersOnly(): boolean {
        return this._form.value.activated;
    }

    constructor(private apollo: Apollo, private notifierService: NotifierService) {
        this._form = this.createForm();
    }

    public onReset(): void {
        this._form.reset();
        this._onState.emit({
            ...this.state,
            filters: {
                userId: null,
                activated: null,
                role: null
            },
            page: 1,
        });
    }

    public onSubmit(): void {
        this.onState.emit(this.processForm());
    }

    public ngOnInit(): void {
        this.form.patchValue(this.state.filters);

        this.apollo.query<any>({
            errorPolicy: 'all',
            query: gql`
                {
                    rolesAndGroups {
                        name
                    }
                }
            `,
        }).pipe(takeUntil(this.destroy$)).subscribe((result) => {
            this.loading = result.loading;
            if (result.errors) {
                this.notifierService.notify('error', 'There was an error loading the filters');

            } else {
                this._roles = result.data.rolesAndGroups || [];
            }
        });

        if (this.state.filters.userId != null) {
            this.apollo.query<any>({
                errorPolicy: 'all',
                query: gql`
                       query user($id: Int!) {
                          user(id: $id) {
                            id
                            firstName
                            lastName
                            fullName
                          }
                        }
                     `,
                variables: {
                    id: this.state.filters.userId,
                },
            }).pipe(takeUntil(this.destroy$)).subscribe(({data}) => {
                if (data) {
                    this.form.get('user').patchValue(data.user);
                } else {
                    this.form.get('user').patchValue(null);
                    this.onState.emit(this.processForm());
                }
            });
        }
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private createForm(): FormGroup {
        return new FormGroup({
            user: new FormControl(null),
            activated: new FormControl(null),
            role: new FormControl(null),
        });
    }

    private processForm(): UsersFilterState {
        const {user, activated, role} = this._form.value;
        return {
            ...this._state,
            filters: {
                userId: user ? user.id : null,
                activated,
                role
            },
            page: 1,
        };
    }

}
