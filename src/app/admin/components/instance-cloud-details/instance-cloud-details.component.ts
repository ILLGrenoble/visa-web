import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {CloudInstance, Instance} from 'app/core/graphql';
import gql from 'graphql-tag';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-instance-cloud-details',
    templateUrl: './instance-cloud-details.component.html',
})
export class InstanceCloudDetailsComponent implements OnInit, OnDestroy {

    private _details: CloudInstance;

    private _instance: Instance;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get details(): CloudInstance {
        return this._details;
    }

    set details(value: CloudInstance) {
        this._details = value;
    }

    public get instance(): Instance {
        return this._instance;
    }

    @Input('instance')
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
                        cloudInstance {
                            address
                            fault {
                                message
                                code
                                details
                                created
                            }
                            securityGroups
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
                map(({data}) => data.instance.cloudInstance),
            ).subscribe((details) => this.details = details);
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

}
