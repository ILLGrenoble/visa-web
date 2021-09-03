import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Experiment, Instance} from 'app/core/graphql';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-instance-experiments',
    templateUrl: './instance-experiments.component.html',
})
export class InstanceExperimentsComponent implements OnInit, OnDestroy {

    private _instance: Instance;

    private _experiments: Experiment[];

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

    get experiments(): Experiment[] {
        return this._experiments;
    }

    set experiments(value: Experiment[]) {
        this._experiments = value;
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
                       experiments {
                            id
                            instrument {
                                id
                                name
                            }
                            proposal  {
                                id
                                identifier
                                title
                            }
                            startDate
                            endDate
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
                map(({data}) => data.instance.experiments),
            ).subscribe((experiments) => this.experiments = experiments);
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

}
