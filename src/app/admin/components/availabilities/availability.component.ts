import {Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {Flavour, FlavourAvailabilitiesFuture} from '../../../core/graphql';
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
export class AvailabilityComponent implements OnInit {

    private _availability: FlavourAvailabilitiesFuture;
    private _chartData: AvailabilityChartData;

    private _highcharts: typeof Highcharts = Highcharts;
    private _axisData$: BehaviorSubject<{min: number, max: number}>;
    private _reset$: Subject<void>;

    private chart: Highcharts.Chart;

    chartCallback = (chart) => {
        this.chart = chart; // keep reference
    };

    constructor() {
    }

    get availability(): FlavourAvailabilitiesFuture {
        return this._availability;
    }

    @Input()
    set availability(value: FlavourAvailabilitiesFuture) {
        this._availability = value;
    }

    @Input('axisData')
    set axisData$(value: BehaviorSubject<{ min: number; max: number }>) {
        this._axisData$ = value;
    }

    @Input('reset')
    set reset$(value: BehaviorSubject<void>) {
        this._reset$ = value;
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
        this._chartData = new AvailabilityChartData(this._availability.flavour, this._availability.availabilities, this._axisData$);

        this._axisData$.pipe(
            filter(value => !!value)
        ).subscribe(data => {
            this.chart.xAxis[0].setExtremes(data.min, data.max, true, false);
        });

        this._reset$.subscribe(() => {
            this.chart.zoomOut();
        });
    }

}
