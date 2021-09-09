import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {cloneDeep} from 'lodash';
import {Flavour, Image, PageInfo, Pagination, Plan} from '../../../core/graphql/types';
import {PlanNewComponent} from '../plan-new';
import {PlanUpdateComponent} from '../plan-update';
import gql from 'graphql-tag';
import {map, takeUntil} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-admin-plans',
    styleUrls: ['./plans.component.scss'],
    templateUrl: './plans.component.html',
})

export class PlansComponent implements OnInit, OnDestroy {

    @ViewChild('datagridRef') public datagrid: any;

    public pageInfo: PageInfo;
    public pageSize = 100;
    public plans: Plan[] = [];
    private planPagination: Pagination;
    private pagination: Pagination;

    public loading: boolean;
    private images: Image[] = [];
    private flavours: Flavour[] = [];

    private state = {page: {from: 0, size: this.pageSize}};

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private apollo: Apollo,
                private snackBar: MatSnackBar,
                private dialog: MatDialog) {
    }

    public ngOnInit(): void {

        this.planPagination = {offset: this.state.page.from, limit: this.state.page.size};
        this.pagination = {offset: 0};

        this.loadPlansImagesFlavours();
        setTimeout(() => this.datagrid.resize());
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    public onRefresh(): void {
        this.loadPlansImagesFlavours();
    }

    public loadPlansImagesFlavours(): void {
        this.loading = true;

        this.apollo.query<any>({
            query: gql`
                query AllFlavours($pagination: Pagination!){
                    flavours(pagination:$pagination) {
                        pageInfo {
                            currentPage
                            totalPages
                            count
                            offset
                            limit
                            hasNextPage
                            hasPrevPage
                        }
                        data {
                            id
                            name
                            memory
                            cpu
                            computeId
                        }
                    },
                    images(pagination:$pagination) {
                         pageInfo {
                            currentPage
                            totalPages
                            count
                            offset
                            limit
                            hasNextPage
                            hasPrevPage
                        }
                        data{
                            id
                            name
                            version
                            description
                            visible
                            deleted
                            icon
                            computeId
                            protocols{
                                id
                                name
                            }
                        }
                    }
                }
            `,
            variables: {pagination: this.pagination},
        }).pipe(
            map(({data}) => ({flavours: data.flavours.data, images: data.images.data})),
            takeUntil(this._destroy$)
        ).subscribe(data => {
            this.flavours = data.flavours;
            this.images = data.images;
            this.loading = false;
            this.loadPlans();
        });
    }

    public loadPlans(): void {
        this.apollo.query<any>({
            query: gql`
                query allPlans($pagination: Pagination!){
                    plans(pagination:$pagination){
                        pageInfo {
                            currentPage
                            totalPages
                            count
                            offset
                            limit
                            hasNextPage
                            hasPrevPage
                        }
                        data {
                            id
                            image {
                                id
                                name
                                description
                                version
                                icon
                                computeId
                                visible
                                deleted
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
                    }
                }
            `,
            variables : {pagination: this.planPagination},
        }).pipe(
            map(({data}) => (data.plans)),
            takeUntil(this._destroy$)
        ).subscribe(planConnection => {
            this.plans = planConnection.data;
            this.pageInfo = planConnection.pageInfo;
        });
    }

    public onCreate(): void {
        const dialogRef = this.dialog.open(PlanNewComponent, {
            width: '800px',
            data: {images: this.images, flavours: this.flavours},
        });
        dialogRef.componentInstance.create.subscribe((planInput: any) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation CreatePlan($input: CreatePlanInput!){
                        createPlan(input:$input) {
                            id
                            image {
                                id
                                name
                                description
                                icon
                                computeId
                                visible
                                deleted
                            }
                            flavour {
                                id
                                name
                                memory
                                cpu
                                computeId
                            }
                        }
                    }
                `,
                variables: {input: planInput},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.planSnackBar('Plan created');
                    this.loadPlans();
                })
                .catch((error) => {
                    this.planSnackBar(error);
                });
        });
    }

    public onUpdate(plan): void {
        const dialogRef = this.dialog.open(PlanUpdateComponent, {
            width: '800px', data: {
                plan: cloneDeep(plan), images: this.images, flavours: this.flavours,
            },
        });
        dialogRef.componentInstance.update.subscribe((data) => {
            this.apollo.mutate<any>({
                mutation: gql`
                    mutation UpdatePlan($id: Int!,$input: UpdatePlanInput!){
                        updatePlan(id:$id,input:$input) {
                            id
                            image {
                                id
                                name
                                description
                                icon
                                computeId
                                visible
                                deleted
                            }
                            flavour {
                                id
                                name
                                memory
                                cpu
                                computeId
                            }
                        }
                    }
                `,
                variables: {id: plan.id, input: data},
            }).toPromise()
                .then(() => {
                    dialogRef.close();
                    this.planSnackBar('Plan updated');
                    this.loadPlans();
                })
                .catch((error) => {
                    this.planSnackBar(error);
                });
        });
    }

    private planSnackBar(message): void {
        this.snackBar.open(message, 'OK', {
            duration: 4000,
        });

    }
}
