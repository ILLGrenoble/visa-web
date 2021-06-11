import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Instance, InstanceMember} from 'app/core/graphql';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-instance-members',
    templateUrl: './instance-members.component.html',
})
export class InstanceMembersComponent implements OnInit, OnDestroy {

    private _instance: Instance;

    private _members: InstanceMember[];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = false;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get members(): InstanceMember[] {
        return this._members;
    }

    set members(value: InstanceMember[]) {
        this._members = value;
    }

    @Input()
    public get instance(): Instance {
        return this._instance;
    }

    public set instance(instance: Instance) {
        this._instance = instance;
    }

    constructor(private apollo: Apollo) {

    }

    public ngOnInit(): void {
        this.apollo.query<any>({
            query: gql`
                query Instance($id: Int!) {
                    instance(id: $id) {
                          members {
                            id
                            role
                            user {
                              id
                              fullName
                            }
                            createdAt
                        }
                    }
                }
                `,
            variables: {
                id: this.instance.id,
            },
        })
            .pipe(
                takeUntil(this.destroy$),
                map(({data}) => data.instance.members),
            ).subscribe((members) => this.members = members);
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

}
