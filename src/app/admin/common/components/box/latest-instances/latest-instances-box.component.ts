import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {ApolloQueryResult} from '@apollo/client';
import {Instance} from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {Observable, Subject} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-latest-instances-box',
    templateUrl: './latest-instances-box.component.html',
})
export class LatestInstancesBoxComponent implements OnInit, OnDestroy {

    private _refresh$: Subject<void>;

    private _data: Instance[];

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = true;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    public get data(): Instance[] {
        return this._data;
    }

    public set data(value: Instance[]) {
        this._data = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    constructor(private apollo: Apollo, private notifierService: NotifierService) {
    }

    public ngOnInit(): void {
        this.refresh$
            .pipe(takeUntil(this.destroy$),
                tap(() => this.loading = true),
                switchMap(() => this.fetch()),
            )
            .subscribe(({data, loading, errors}) => {
                if (errors) {
                    this.notifierService.notify('error', `There was an error fetching the latest instances`);
                } else {
                    this.data = data.recentInstances.data;
                }
                this.loading = loading;
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private fetch(): Observable<ApolloQueryResult<any>> {
        return this.apollo.query<any>({
            query: gql`
                {
                  recentInstances(pagination: { limit: 15, offset: 0 }) {
                    data {
                      id
                      name
                      createdAt
                      plan {
                        image {
                          name
                          version
                        }
                        flavour {
                          name
                        }
                      }
                      state
                      cloudInstance {
                        address
                      }
                      owner {
                        id
                        fullName
                        affiliation {
                          name
                        }
                      }
                    }
                  }
                }
            `,
        });
    }

    public formatImageName(image): void {
        return image.version ? `${image.name} (${image.version})` : image.name;
    }

}
