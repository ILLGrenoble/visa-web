import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {BookingRequest, Flavour, FlavourAvailabilitiesFuture} from '../../../core/graphql';
import * as Highcharts from "highcharts";
import {AvailabilityChartData} from "./availability-chart-data";
import {BehaviorSubject, Subject} from "rxjs";
import {filter} from "rxjs/operators";

@Component({
    selector: 'visa-admin-availability',
    templateUrl: './availability.component.html',
    styleUrls: ['./availability.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AvailabilityComponent implements OnInit, OnDestroy {

    private _availability: FlavourAvailabilitiesFuture;
    private _chartData: AvailabilityChartData;

    private _highcharts: typeof Highcharts = Highcharts;
    private _axisData$: BehaviorSubject<{min: number, max: number}>;
    private _reset$: Subject<void>;
    private _bookings: BookingRequest[];
    private _showUncertaintyRegion: boolean = true;
    private _redrawCharts$: Subject<void>;

    private chart: Highcharts.Chart;

    chartCallback = (chart) => {
        this.chart = chart;
    };

    constructor() {
    }

    get availability(): FlavourAvailabilitiesFuture {
        return this._availability;
    }

    @Input()
    set availability(value: FlavourAvailabilitiesFuture) {
        this._availability = value;
        this.redraw();
    }

    @Input('axisData')
    set axisData$(value: BehaviorSubject<{ min: number; max: number }>) {
        this._axisData$ = value;
        this.redraw();
    }

    @Input('reset')
    set reset$(value: BehaviorSubject<void>) {
        this._reset$ = value;
    }

    @Input()
    set bookings(bookings: BookingRequest[]) {
        this._bookings = bookings;
        this.redraw();
    }

    @Input()
    set showUncertaintyRegion(value: boolean) {
        this._showUncertaintyRegion = value;
    }

    get flavour(): Flavour {
        return this._availability.flavour;
    }

    get chartData(): AvailabilityChartData {
        return this._chartData;
    }

    get highcharts(): typeof Highcharts {
        return this._highcharts;
    }

    public ngOnInit(): void {
        this._highcharts.setOptions({
            time: {useUTC: false},
        })
        this._chartData = new AvailabilityChartData(this._availability.flavour, this._availability.availabilities, this._axisData$, this._bookings, this._showUncertaintyRegion);
        this._redrawCharts$ = new Subject<void>();
        this._redrawCharts$.subscribe(() => {
            this._chartData = new AvailabilityChartData(this._availability.flavour, this._availability.availabilities, this._axisData$, this._bookings, this._showUncertaintyRegion);
        })

        if (this._axisData$) {
            this._axisData$.pipe(
                filter(value => !!value)
            ).subscribe(data => {
                this.chart.xAxis[0].setExtremes(data.min, data.max, true, false);
            });
        }

        if (this._reset$) {
            this._reset$.subscribe(() => {
                this.chart.zoomOut();
            });
        }
    }

    public ngOnDestroy(): void {
        if (this._redrawCharts$) {
            this._redrawCharts$.unsubscribe();
        }
    }

    private redraw(): void {
        if (this._redrawCharts$) {
            this._redrawCharts$.next();
        }
    }

}
