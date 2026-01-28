import {Component, OnDestroy, OnInit} from '@angular/core';
import {Plan} from '../../../core/graphql';
import gql from 'graphql-tag';
import {delay, map, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import {Subject} from 'rxjs';
import {NotifierService} from 'angular-notifier';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'visa-admin-plans',
    templateUrl: './plans.component.html',
})

export class PlansComponent implements OnInit, OnDestroy {

    private _plans: Plan[] = [];
    private _loading: boolean;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<void> = new Subject();
    private _multiCloudEnabled = false;

    private _modalData$ = new Subject<{ plan: Plan, clone: boolean }>();
    private _planToDelete: Plan;

    get modalData$(): Subject<{ plan: Plan; clone: boolean }> {
        return this._modalData$;
    }

    get showDeleteModal(): boolean {
        return this._planToDelete != null;
    }

    constructor(private readonly _apollo: Apollo,
                private readonly _notifierService: NotifierService,
                private readonly _titleService: Title) {
    }

    get plans(): Plan[] {
        return this._plans;
    }

    get loading(): boolean {
        return this._loading;
    }

    public onRefresh(): void {
        this._refresh$.next();
    }

    get multiCloudEnabled(): boolean {
        return this._multiCloudEnabled;
    }

    public ngOnInit(): void {
        this._titleService.setTitle(`Plans | Cloud | Admin | VISA`);

        this._refresh$
            .pipe(
                startWith(0),
                takeUntil(this._destroy$),
                tap(() => this._loading = true),
                delay(250),
                switchMap(() => this._apollo.query<any>({
                    query: gql`
                        query allPlans {
                            plans {
                                id
                                image {
                                    id
                                    name
                                    description
                                    version
                                    icon
                                    computeId
                                    visible
                                    cloudClient {
                                        id
                                        name
                                    }
                                }
                                flavour {
                                    id
                                    name
                                    memory
                                    cpu
                                    computeId
                                }
                                preset
                            }
                            cloudClients {
                                id
                            }
                        }
                    `
                })),
                map(({data}) => ({
                    plans: data.plans,
                    cloudClients: data.cloudClients,
                })),
                tap(() => this._loading = false)
            )
            .subscribe(({plans, cloudClients}) => {
                this._plans = plans;
                this._multiCloudEnabled = cloudClients.length > 1 || plans
                    .map((plan) => plan.image.cloudClient?.id || 0)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .length > 1;
            });

    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onCreate(plan?: Plan): void {
        this.modalData$.next({plan: plan, clone: !!plan});
    }

    public onUpdate(plan: Plan): void {
        this.modalData$.next({plan: plan, clone: false});
    }

    public onDelete(plan: Plan): void {
        this._planToDelete = plan;
    }

    public onConfirmDelete(): void {
        if (this._planToDelete) {
            this._apollo.mutate({
                mutation: gql`
                        mutation DeletePlan($id: Int!){
                            deletePlan(id:$id) {
                                id
                            }
                        }
                    `,
                variables: {id: this._planToDelete.id},
            }).pipe(
                takeUntil(this._destroy$)
            ).subscribe({
                next: () => {
                    this._planToDelete = null;
                    this._notifierService.notify('success', 'Successfully deleted plan');
                    this._refresh$.next();
                },
                error: (error) => {
                    this._notifierService.notify('error', error);
                }
            });
        }
    }

    public onDeleteModalClosed(): void {
        this._planToDelete = null;
    }


    public onPlanSaved(): void {
        this._refresh$.next();
    }

}
