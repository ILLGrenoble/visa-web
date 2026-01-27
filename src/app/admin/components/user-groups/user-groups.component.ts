import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Role} from '../../../core/graphql';
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-admin-user-groups',
    templateUrl: './user-groups.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./user-groups.component.scss']
})

export class UserGroupsComponent implements OnInit, OnDestroy {

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _onChange: EventEmitter<void> = new EventEmitter();

    private _loading: boolean;
    private _userGroups: Role[] = [];

    private _modalData$ = new Subject<{ role: Role }>();
    private _groupToDelete: Role;

    @Output('onChange')
    public get onChange(): EventEmitter<void> {
        return this._onChange;
    }

    get userGroups(): Role[] {
        return this._userGroups;
    }

    get loading(): boolean {
        return this._loading;
    }

    get modalData$(): Subject<{ role: Role }> {
        return this._modalData$;
    }

    get showDeleteModal(): boolean {
        return this._groupToDelete != null;
    }

    get groupToDelete(): Role {
        return this._groupToDelete;
    }

    constructor(private _apollo: Apollo,
                private _notifierService: NotifierService) {
    }

    public ngOnInit(): void {
        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(500),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                      query {
                          groups {
                            id
                            name
                            description
                          }
                        }
                    `
                })),
                map(({data}) => ({groups: data.groups})),
                tap(() => this._loading = false)
            )
            .subscribe(({groups}) => {
                this._userGroups = groups || [];
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    public onDelete(userGroup: Role): void {
        this._groupToDelete = userGroup;
    }

    public onConfirmDelete(): void {
        if (this._groupToDelete) {
            this._apollo.mutate({
                mutation: gql`
                mutation DeleteRole($id: Int!){
                  deleteRole(id: $id)
                }
            `,
            variables: {
                id: this._groupToDelete.id
            },
            }).subscribe(() => {
                this._notifierService.notify('success', 'Successfully deleted user group');
                this._groupToDelete = null;
                this._refresh$.next();
                this._onChange.emit();
            });

        }
    }

    public onCreate(): void {
        this._modalData$.next({role: null});
    }

    public onEdit(userGroup: Role): void {
        this._modalData$.next({role: userGroup});
    }

    public onDeleteModalClosed(): void {
        this._groupToDelete = null;
    }

    public onGroupSaved(): void {
        this._refresh$.next();
        this._onChange.emit();
    }

}
