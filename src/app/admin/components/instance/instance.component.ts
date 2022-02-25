import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Apollo} from 'apollo-angular';
import {Instance} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {BehaviorSubject, Observable, Subject, timer} from 'rxjs';
import {delay, map, retryWhen, share, switchMap, take, takeUntil} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
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
            this.instance = data;
            if (this._terminationDate == null) {
                this._terminationDate = new Date(this.instance.terminationDate);
                this._minDate = `${this._terminationDate.getFullYear()}-${this._terminationDate.getMonth() + 1}-${this._terminationDate.getDate()}`;
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
            }).toPromise().then(() => {
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
        }).toPromise().then(() => {
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
        }).toPromise().then(() => {
            this.notifierService.notify('success', 'Starting instance');
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
        const dateString = moment(this._terminationDate).format('YYYY-MM-DD HH:mm');
        this.apollo.mutate({
            mutation: gql`
                  mutation updateInstanceTerminationDate($id: Int!, $date: String!) {
                    updateInstanceTerminationDate(id: $id, date: $date) {
                      message
                    }
                  }
                `,
            variables: {
                id: this.instance.id,
                date: dateString
            },
        }).toPromise().then(() => {
            this.instance.terminationDate = this._terminationDate.toString();
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


    public getThumbnailUrlForInstance(instance: Instance): string {
        const baseUrl = environment.paths.api;
        return `${baseUrl}/instances/${instance.id}/thumbnail`;
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

}
