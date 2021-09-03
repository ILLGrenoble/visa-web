import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AccountService} from '@core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {InstancesFilterState} from './instances-filter-state';

@Component({
    selector: 'visa-admin-instances-filter',
    templateUrl: './instances-filter.component.html',
    styleUrls: ['./instances-filter.component.scss'],
})
export class InstancesFilterComponent implements OnInit, OnDestroy {

    private static ADMIN_INSTANCES_FILTER_COLUMNS_KEY = 'admin.instances.filter.columns';

    private _state: InstancesFilterState;

    private _onState: EventEmitter<InstancesFilterState> = new EventEmitter();

    private _form: FormGroup;

    private _data: any[];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = true;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    public get state(): InstancesFilterState {
        return this._state;
    }

    @Input('state')
    public set state(value: InstancesFilterState) {
        this._state = value;
    }

    @Output('onState')
    public get onState(): EventEmitter<InstancesFilterState> {
        return this._onState;
    }

    public set onState(value: EventEmitter<InstancesFilterState>) {
        this._onState = value;
    }

    public get form(): FormGroup {
        return this._form;
    }

    public set form(value: FormGroup) {
        this._form = value;
    }

    public get data(): any[] {
        return this._data;
    }

    public set data(value: any[]) {
        this._data = value;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(value: boolean) {
        this._loading = value;
    }

    constructor(private apollo: Apollo, private accountService: AccountService, private snackBar: MatSnackBar) {
        this._form = this.createForm();
    }

    public onReset(): void {
        this._form.reset();
        this._onState.emit({
            ...this.state,
            filters: {
                id: null,
                name: null,
                flavour: null,
                image: null,
                instrument: null,
                state: null,
                user: null,
            },
            page: 1,
        });
    }

    public onSubmit(): void {
        this.onState.emit(this.processForm());
    }

    public onColumn(column): void {
        this.state.columns[column] = !this.state.columns[column];
        this.onState.emit(this.state);
        this.updateColumnsLocalStorage();
    }

    public onResetColumns(): void {
        this.state.columns = {
            image: false,
            flavour: false,
            terminationDate: false,
        };
        this.onState.emit(this.state);
    }

    public ngOnInit(): void {
        const visibleColumnsString = localStorage.getItem(InstancesFilterComponent.ADMIN_INSTANCES_FILTER_COLUMNS_KEY);
        if (visibleColumnsString != null && visibleColumnsString.length !== undefined) {
            const visibleColumns = visibleColumnsString.split(',');
            visibleColumns.forEach((visibleColumn) => {
                if (this.state.columns[visibleColumn] != null) {
                    this.state.columns[visibleColumn] = true;
                }
            });
        }

        this.form.patchValue(this.state.filters);
        this.apollo.query<any>({
            errorPolicy: 'all',
            query: gql`
                {
                    instanceStates: __type(name: "InstanceState") {
                        enumValues {
                            name
                        }
                    }
                    instruments {
                        id
                        name
                    }
                    images(pagination: {offset: 0}) {
                        data {
                            id
                            name
                        }
                    }
                    flavours(pagination: {offset: 0, limit: 50}) {
                        data {
                            id
                            name
                        }
                    }
                }
            `,
        }).pipe(takeUntil(this.destroy$)).subscribe((result) => {
            this.data = result.data;
            this.loading = result.loading;
            if (result.errors) {
                this.snackBar.open('There was an error loading the filters', 'OK');
            }
        });
        if (this.state.filters.user != null) {
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
                    id: this.state.filters.user,
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
            id: new FormControl(null),
            name: new FormControl(null),
            flavour: new FormControl(null),
            image: new FormControl(null),
            instrument: new FormControl(null),
            state: new FormControl(null),
            user: new FormControl(null),
        });
    }

    private processForm(): InstancesFilterState {
        const {id, name, flavour, image, instrument, state, user} = this._form.value;
        return {
            ...this._state,
            filters: {
                id,
                name,
                flavour,
                image,
                instrument,
                state,
                user: user ? user.id : null,
            },
            page: 1,
        };
    }

    private updateColumnsLocalStorage(): void {
        const visibleColumns = [];
        for (const column in this.state.columns) {
            if (this.state.columns[column] === true) {
                visibleColumns.push(column);
            }
        }
        localStorage.setItem(InstancesFilterComponent.ADMIN_INSTANCES_FILTER_COLUMNS_KEY, visibleColumns.join(','));
    }

}
