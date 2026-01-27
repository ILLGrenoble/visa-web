import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Apollo} from 'apollo-angular';
import {User} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-user',
    templateUrl: './user.component.html',
})
export class UserComponent implements OnInit, OnDestroy {

    private _user: User;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _modalData$ = new Subject<{ user: User }>();

    public get user(): User {
        return this._user;
    }

    get modalData$(): Subject<{ user: User }> {
        return this._modalData$;
    }

    constructor(private apollo: Apollo,
                private route: ActivatedRoute) {
    }

    public ngOnInit(): void {
        this.refresh();
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public handleEdit(): void {
        this.modalData$.next({user: this._user});
    }

    public refresh(): void {
        const id = this.route.snapshot.params.id;
        this.apollo.query<any>({
            query: gql`
                query User($id: String!) {
                    user(id: $id) {
                        id
                        firstName
                        lastName
                        email
                        fullName
                        affiliation {
                            name
                        }
                        instanceQuota
                        lastSeenAt
                        activatedAt
                        activeUserRoles {
                            role {
                                id
                                name
                            }
                            expiresAt
                        }
                        groups {
                            id
                            name
                        }
                        instances {
                            id
                            name
                            uid
                            username
                            ipAddress
                            owner {
                                id
                            }
                            terminationDate
                        }
                    }
                }
                `,
            variables: {
                id,
            },
        })
            .pipe(
                map(({data}) => data.user),
                takeUntil(this._destroy$)
            ).subscribe((data) => {
                this._user = data;
            });
    }

    public onUserSaved(): void {
        this.refresh();
    }
}
