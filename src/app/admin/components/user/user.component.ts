import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Apollo} from 'apollo-angular';
import {User} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';
import {MatDialog} from '@angular/material/dialog';
import {UserEditComponent} from '../user-edit';
import {UserInput} from '../../../core/graphql';

@Component({
    selector: 'visa-admin-user',
    templateUrl: './user.component.html',
})
export class UserComponent implements OnInit, OnDestroy {

    private _user: User;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    public get user(): User {
        return this._user;
    }

    public set user(user: User) {
        this._user = user;
    }

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    constructor(private apollo: Apollo,
                private route: ActivatedRoute,
                private router: Router,
                private dialog: MatDialog,
                private notifierService: NotifierService) {

    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public ngOnInit(): void {
        this.refresh();
    }


    public handleEdit(): void {
        const dialogRef = this.dialog.open(UserEditComponent, {
            width: '800px',
            data: this._user
        });
        dialogRef.componentInstance.onSubmit$
            .pipe(takeUntil(this.destroy$))
            .subscribe((input: UserInput) => {
                const id = this._user.id;
                this.apollo.mutate({
                    mutation: gql`
                      mutation updateUser($id: String!, $input: UserInput!) {
                        updateUser(id: $id, input: $input) {
                          id
                        }
                      }
                    `,
                    variables: {
                        id,
                        input
                    },
                }).subscribe(() => {
                    this.refresh();
                    this.notifierService.notify('success', 'Updated user successfully');
                });
            });
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
                            owner {
                                id
                            }
                            terminationDate
                            cloudInstance {
                               address
                            }
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
                takeUntil(this.destroy$)
            ).subscribe((data) => {
                this._user = data;
            });
    }


}
