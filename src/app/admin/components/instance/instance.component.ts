import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {Apollo} from 'apollo-angular';
import {Instance} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {BehaviorSubject, Observable, Subject, timer} from 'rxjs';
import {delay, map, retryWhen, share, switchMap, take, takeUntil} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';

@Component({
    selector: 'visa-admin-instance',
    templateUrl: './instance.component.html',
})
export class InstanceComponent implements OnInit, OnDestroy {

    private _instance: Instance;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _refreshSession$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

    public get instance(): Instance {
        return this._instance;
    }

    public set instance(instance: Instance) {
        this._instance = instance;
    }

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get refreshSession$(): BehaviorSubject<boolean> {
        return this._refreshSession$;
    }

    set refreshSession$(value: BehaviorSubject<boolean>) {
        this._refreshSession$ = value;
    }

    constructor(private apollo: Apollo,
                private route: ActivatedRoute,
                private router: Router,
                private snackBar: MatSnackBar) {

    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public ngOnInit(): void {
        this.instance = this.route.snapshot.data.instance;
        timer(1, 2500).pipe(
            switchMap(() => this.refresh()),
            retryWhen((errors) => errors.pipe(delay(1000), take(10))),
            share(),
            takeUntil(this.destroy$),
        ).subscribe((data) => {
            this.instance = data;
        });
    }

    public handleDelete(): void {
        const confirmation = window.confirm('Are you sure you want to delete this instance?');
        if (confirmation) {
            this.apollo.mutate({
                mutation: gql`
                  mutation deleteInstance($id: Int!) {
                    deleteInstance(id: $id) {
                      message
                    }
                  }
                `,
                variables: {
                    id: this.instance.id,
                },
            }).toPromise().then(() => {
                this.router.navigate(['/admin/dashboard']).then(() => {
                    this.snackBar.open('The instance will be deleted', 'OK', {
                        duration: 2000,
                    });
                });
            });
        }
    }

    public handleShutdown(): void {
        this.apollo.mutate({
            mutation: gql`
                  mutation shutdownInstance($id: Int!) {
                    shutdownInstance(id: $id) {
                      message
                    }
                  }
                `,
            variables: {
                id: this.instance.id,
            },
        }).toPromise().then(() => {
            this.snackBar.open('Shutting down instance', 'OK', {
                duration: 2000,
            });
        });
    }

    public handleStart(): void {
        this.apollo.mutate({
            mutation: gql`
                  mutation startInstance($id: Int!) {
                    startInstance(id: $id) {
                      message
                    }
                  }
                `,
            variables: {
                id: this.instance.id,
            },
        }).toPromise().then(() => {
            this.snackBar.open('Starting instance', 'OK', {
                duration: 2000,
            });
        });
    }

    public handleReboot(): void {
        this.apollo.mutate({
            mutation: gql`
                  mutation rebootInstance($id: Int!) {
                    startInstance(id: $id) {
                      message
                    }
                  }
                `,
            variables: {
                id: this.instance.id,
            },
        }).toPromise().then(() => {
            this.snackBar.open('Rebooting instance', 'OK', {
                duration: 2000,
            });
        });
    }

    public refresh(): Observable<any> {
        const id = +this.route.snapshot.params.id;
        return this.apollo.query<any>({
            query: gql`
                query Instance($id: Int!) {
                    instance(id: $id) {
                        id
                        name
                        comments
                        state
                        terminationDate
                        lastSeenAt
                        createdAt
                        keyboardLayout
                        owner {
                            id
                            firstName
                            lastName
                            fullName
                            email
                            affiliation {
                                name
                            }
                        }
                        username
                        attributes {
                            id,
                            name,
                            value
                        }
                        members {
                            role
                            user {
                              id
                              fullName
                            }
                        }
                        plan {
                            image {
                                name
                            }
                            flavour {
                                name
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
                map(({data}) => data.instance),
            );
    }


    public getThumbnailUrlForInstance(instance: Instance): string {
        const baseUrl = environment.paths.api;
        return `${baseUrl}/instances/${instance.id}/thumbnail`;
    }


}
