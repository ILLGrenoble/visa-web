import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Apollo} from 'apollo-angular';
import {Instance} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {BehaviorSubject, Observable, Subject, timer} from 'rxjs';
import {delay, map, retryWhen, share, switchMap, take, takeUntil} from 'rxjs/operators';
import * as moment from 'moment';
import {NotifierService} from 'angular-notifier';

@Component({
    selector: 'visa-admin-instance',
    templateUrl: './instance.component.html',
})
export class InstanceComponent implements OnInit, OnDestroy {

    private _instance: Instance;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _refreshSession$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

    private _settingDate = false;
    private _terminationDate: Date;
    private _minDate: string;

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

    get settingDate(): boolean {
        return this._settingDate;
    }

    set settingDate(value: boolean) {
        this._settingDate = value;
    }

    get terminationDate(): Date {
        return this._terminationDate;
    }

    set terminationDate(value: Date) {
        const hours = this._terminationDate.getHours();
        const minutes = this._terminationDate.getMinutes();
        this._terminationDate = value;
        value.setHours(hours);
        value.setMinutes(minutes);
    }

    get minDate(): string {
        return this._minDate;
    }

    get isImmortal(): boolean {
        return this._instance.terminationDate == null;
    }

    constructor(private apollo: Apollo,
                private route: ActivatedRoute,
                private router: Router,
                private notifierService: NotifierService) {

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
            if (!this._settingDate) {
                this.instance = data;
                const now = new Date();
                this._minDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
                if (this.instance.terminationDate) {
                    this._terminationDate = new Date(this.instance.terminationDate);
                    // this._minDate = `${this._terminationDate.getFullYear()}-${this._terminationDate.getMonth() + 1}-${this._terminationDate.getDate()}`;
                } else {
                    this._terminationDate = null;
                }
            }
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
            }).subscribe(() => {
                this.router.navigate(['/admin/dashboard']).then(() => {
                    this.notifierService.notify('success', 'The instance will be deleted');
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
        }).subscribe(() => {
            this.notifierService.notify('success', 'Shutting down instance');
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
        }).subscribe(() => {
            this.notifierService.notify('success', 'Starting instance');
        });
    }

    public handleReboot(): void {
        this.apollo.mutate({
            mutation: gql`
                  mutation rebootInstance($id: Int!) {
                    rebootInstance(id: $id) {
                      message
                    }
                  }
                `,
            variables: {
                id: this.instance.id,
            },
        }).subscribe(() => {
            this.notifierService.notify('success', 'Rebooting instance');
        });
    }

    public terminationDateHasChanged(): boolean {
        const terminationDateString = moment(this._terminationDate).format('YYYY-MM-DD');
        const instanceTerminationDateString = moment(new Date(this.instance.terminationDate)).format('YYYY-MM-DD');

        return terminationDateString !== instanceTerminationDateString;

    }

    public handleUpdateTerminationDate(): void {
        this._settingDate = false;
        const dateString = this._terminationDate ? moment(this._terminationDate).format('YYYY-MM-DD HH:mm') : null;
        this.apollo.mutate({
            mutation: gql`
                  mutation updateInstanceTerminationDate($id: Int!, $date: String) {
                    updateInstanceTerminationDate(id: $id, date: $date) {
                      message
                    }
                  }
                `,
            variables: {
                id: this.instance.id,
                date: dateString
            },
        }).subscribe(() => {
            this.instance.terminationDate = this._terminationDate ? this._terminationDate.toString() : null;
            this.notifierService.notify('success', 'Updated instance termination date');
        });
    }

    public resetTerminationDate(): void {
        this._terminationDate = new Date(this.instance.terminationDate);
        this._settingDate = false;
    }

    public refresh(): Observable<any> {
        const id = +this.route.snapshot.params.id;
        return this.apollo.query<any>({
            query: gql`
                query Instance($id: Int!) {
                    instance(id: $id) {
                        id
                        uid
                        name
                        comments
                        state
                        terminationDate
                        lastSeenAt
                        createdAt
                        keyboardLayout
                        vdiProtocol
                        owner {
                            id
                            firstName
                            lastName
                            fullName
                            email
                            affiliation {
                                name
                            }
                            activeUserRoles {
                                role {
                                    name
                                }
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
                                version
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

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

    public toggleImmortal(): void {
        if (this._terminationDate) {
            this._terminationDate = null;
            this.handleUpdateTerminationDate();

        } else {
            const isStaff = this._instance.owner.activeUserRoles.find(userRole => userRole.role.name === 'STAFF') != null;
            const day = 1000 * 60 * 60 * 24;
            const termination = isStaff ? day * 60 : day * 14;
            this._terminationDate = new Date(Date.now() + termination);
            this.handleUpdateTerminationDate();
        }
    }

}
