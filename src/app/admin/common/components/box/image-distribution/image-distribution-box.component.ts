import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {NotifierService} from 'angular-notifier';
import {Apollo} from 'apollo-angular';
import {ApolloQueryResult} from '@apollo/client';
import gql from 'graphql-tag';
import * as Highcharts from 'highcharts';
import {Observable, Subject} from 'rxjs';
import {delay, switchMap, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-image-distribution-box',
    templateUrl: './image-distribution-box.component.html',
})
export class ImageDistributionBoxComponent implements OnInit, OnDestroy {

    private _highcharts: typeof Highcharts = Highcharts;

    private _refresh$: Subject<void>;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _loading = true;

    private _options: any = {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie',
        },
        title: {
            text: '',
        },
        tooltip: {
            pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>',
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: `<b>{point.name}</b>: {point.y} instances`,
                },
                showInLegend: true,
            },
        },
        series: [{
            type: 'pie', name: 'Instances',
            colorByPoint: true,
            data: [],
        }],
    };

    get options(): any {
        return this._options;
    }

    set options(value: any) {
        this._options = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get highcharts(): typeof Highcharts {
        return this._highcharts;
    }

    set highcharts(value: typeof Highcharts) {
        this._highcharts = value;
    }

    constructor(private apollo: Apollo, private notifierService: NotifierService) {
    }

    public ngOnInit(): void {
        this.createDefaultOptions();
        this.refresh$
            .pipe(
                takeUntil(this.destroy$),
                tap(() => this.loading = true),
                delay(1000),
                switchMap(() => this.fetch()),
            )
            .subscribe(({data, loading, errors}) => {
                if (errors) {
                    this.notifierService.notify('error', `There was an error fetching the image distribution statistics`);
                }
                const series = [{
                    name: 'Instances',
                    colorByPoint: true,
                    data: data.countInstancesByImages.map((image) => {
                        return {name: image.version ? `${image.name} (${image.version})` : image.name, y: image.total};
                    }),
                }];
                this.options = {
                    ...this.options,
                    series,
                };
                this.loading = loading;
            });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private createDefaultOptions(): void {
        this.options = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie',
            },
            title: {
                text: '',
            },
            tooltip: {
                pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: `<b>{point.name}</b>: {point.y} instances`,
                    },
                    showInLegend: true,
                },
            },
        };
    }

    private fetch(): Observable<ApolloQueryResult<any>> {
        return this.apollo.query<any>({
                query: gql`
                {
                    countInstancesByImages {
                        id
                        name
                        version
                        total
                    }
                }
                `,
            },
        );
    }

}
