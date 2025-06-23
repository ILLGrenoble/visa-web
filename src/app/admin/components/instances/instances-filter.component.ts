import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {InstancesFilterState} from './instances-filter-state';
import {InstancesColumnsState} from "./instances-columns-state";
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-admin-instances-filter',
    templateUrl: './instances-filter.component.html',
    styleUrls: ['./instances-filter.component.scss'],
})
export class InstancesFilterComponent implements OnInit, OnDestroy {

    private static ADMIN_INSTANCES_FILTER_COLUMNS_KEY = 'admin.instances.filter.columns';

    private _filterState: InstancesFilterState;
    private _columnsState: InstancesColumnsState;

    private _onFilterState: EventEmitter<InstancesFilterState> = new EventEmitter();

    private _form: FormGroup;

    private _data: any[];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = true;

    private _multiCloudEnabled = false;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    public get filterState(): InstancesFilterState {
        return this._filterState;
    }

    public get columnsState(): InstancesColumnsState {
        return this._columnsState;
    }

    @Input('filterState')
    public set filterState(value: InstancesFilterState) {
        this._filterState = value;
    }

    @Output('onFilterState')
    public get onFilterState(): EventEmitter<InstancesFilterState> {
        return this._onFilterState;
    }

    public set onFilterState(value: EventEmitter<InstancesFilterState>) {
        this._onFilterState = value;
    }

    @Input('columnsState')
    public set columnsState(value: InstancesColumnsState) {
        this._columnsState = value;
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

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    constructor(private apollo: Apollo,
                private notifierService: NotifierService) {
        this._form = this.createForm();
    }

    public onReset(): void {
        this._form.reset();
        this._onFilterState.emit({
            ...this.filterState,
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
        this.onFilterState.emit(this.processForm());
    }

    public onColumn(column): void {
        this.columnsState[column] = !this.columnsState[column];
        this.updateColumnsLocalStorage();
    }

    public onResetColumns(): void {
        this.columnsState.vdiProtocol = false;
        this.columnsState.cloudClient = false;
        this.columnsState.image = false;
        this.columnsState.flavour = false;
        this.columnsState.terminationDate = false;
        this.updateColumnsLocalStorage();
    }

    public ngOnInit(): void {
        const visibleColumnsString = localStorage.getItem(InstancesFilterComponent.ADMIN_INSTANCES_FILTER_COLUMNS_KEY);
        if (visibleColumnsString != null && visibleColumnsString.length !== undefined) {
            const visibleColumns = visibleColumnsString.split(',');
            visibleColumns.forEach((visibleColumn) => {
                if (this.columnsState[visibleColumn] != null) {
                    this.columnsState[visibleColumn] = true;
                }
            });
        }

        this.form.patchValue(this.filterState.filters);
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
                    images {
                        id
                        name
                        version
                    }
                    flavours {
                        id
                        name
                    }
                    cloudClients {
                        id
                        name
                    }
                }
            `,
        }).pipe(takeUntil(this.destroy$)).subscribe((result) => {
            this.data = result.data;
            this._multiCloudEnabled = result.data.cloudClients.length > 1;
            this.loading = result.loading;
            if (result.errors) {
                this.notifierService.notify('error', 'There was an error loading the filters');
            }
        });
        if (this.filterState.filters.user != null) {
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
                    id: this.filterState.filters.user,
                },
            }).pipe(takeUntil(this.destroy$)).subscribe(({data}) => {
                if (data) {
                    this.form.get('user').patchValue(data.user);
                } else {
                    this.form.get('user').patchValue(null);
                    this.onFilterState.emit(this.processForm());
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
            ...this._filterState,
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
        for (const column in this.columnsState) {
            if (this.columnsState[column] === true) {
                visibleColumns.push(column);
            }
        }
        localStorage.setItem(InstancesFilterComponent.ADMIN_INSTANCES_FILTER_COLUMNS_KEY, visibleColumns.join(','));
    }

}
