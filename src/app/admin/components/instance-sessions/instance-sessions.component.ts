import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Instance} from 'app/core/graphql';
import gql from 'graphql-tag';
import {BehaviorSubject, Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {InstanceSessionMember} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-instance-sessions',
    templateUrl: './instance-sessions.component.html',
})
export class InstanceSessionsComponent implements OnInit, OnDestroy {

    private _sessions: InstanceSessionMember[] = [];

    private _instance: Instance;

    private _loading = true;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _refresh$: Subject<boolean> = new BehaviorSubject<boolean>(true);

    private _hiddenColumns: string[] = [];

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get refresh$(): Subject<boolean> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<boolean>) {
        this._refresh$ = value;
    }

    get sessions(): InstanceSessionMember[] {
        return this._sessions;
    }

    set sessions(value: InstanceSessionMember[]) {
        this._sessions = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get hiddenColumns(): string[] {
        return this._hiddenColumns;
    }

    @Input('hiddenColumns')
    set hiddenColumns(value: string[]) {
        this._hiddenColumns = value;
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
        this.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.loading = true;
            this.apollo.query<any>({
                query: gql`
                query Instance($id: Int!) {
                    instance(id: $id) {
                       sessions {
                            id
                            user {
                              id
                              firstName
                              lastName
                              fullName
                            }
                            createdAt
                            role
                            duration
                            instanceSession {
                              connectionId
                               instance {
                                 id
                                 uid
                                 name
                               }
                            }
                        }
                    }
                }
                `,
                variables: {
                    id: this.instance.id,
                },
            })
                .pipe(
                    takeUntil(this._destroy$),
                    map(({data}) => data.instance),
                    tap(() => this.loading = false),
                )
                .subscribe((instance) => {
                    this.sessions = instance.sessions;
                });
        });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

}
