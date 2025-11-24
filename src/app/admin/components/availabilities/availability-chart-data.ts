import {Flavour, FlavourAvailability} from "../../../core/graphql";
import {BehaviorSubject} from "rxjs";

export class AvailabilityChartData {


    private _options: any = {
        chart: {
            type: 'area',
            zoomType: 'x',
            panning: true,
            panKey: 'shift',
            events: {
                selection: (event) => {
                    if (event.xAxis) {
                        const min = event.xAxis[0].min;
                        const max = event.xAxis[0].max;
                        this._axisData$.next({ min, max });
                    }
                    return true; // allow zooming
                },

            },
        },
        title: {
            text: '',
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                day: '%e %b %Y',
                week: '%e %b %Y',
                month: '%b %Y',
                year: '%Y'
            },
            tickPixelInterval: 200,
            labels: {
                style: {
                    fontSize: 12,
                    color: '#606060'
                }
            },
            lineColor: '#a0a0a0',
            tickColor: '#a0a0a0',
            events: {
                setExtremes: (event) => {
                    if (event.trigger === 'pan') {
                        const {min, max} = event;
                        this._axisData$.next({ min, max });
                    }
                }
            }
        },
        yAxis: {
            title: '',
            labels: {
                style: {
                    fontSize: 12,
                    color: '#606060'
                }
            },
            lineColor: '#a0a0a0',
            tickColor: '#a0a0a0',
        },
        tooltip: {
            shared: true,
            formatter: function () {
                const totalData = this.points[0];
                const availableData = this.points[1];
                const details = `<span style="color:${availableData.color}">\u25CF</span> Available instances: <b>${availableData.y}</b> / ${totalData.y}`;

                return `<span style="font-size: 0.8em;">${availableData.series.name}</span><br/>${details}`;
            },
        },
        plotOptions: {
            series: {
                step: true,
                color: '#00a65a',
                fillColor: '#edfbf1',
            },
        },
        legend: {
            enabled: false,
        },
        credits: {
            enabled: false,
        },
        series: [],
    }

    get options(): any {
        return this._options;
    }

    constructor(flavour: Flavour, availabilities: FlavourAvailability[], private _axisData$: BehaviorSubject<{min: number, max: number}>) {
        const availableData = availabilities.map(availability => {
            return { x: Date.parse(availability.date), y: availability.availableUnits };
        });
        const totalData = availabilities.map(availability => {
            return { x: Date.parse(availability.date), y: availability.totalUnits };
        });

        const xMin = Math.min(...availableData.map(p => p.x));
        const xMax = Math.max(...availableData.map(p => p.x)) + 24 * 60 * 60 * 1000;
        const yMax = Math.max(...totalData.map(p => p.y)) * 1.1;
        this._options.xAxis = {...this._options.xAxis, min: xMin, max: xMax};
        this._options.yAxis = {...this._options.yAxis, min: 0, max: yMax};

        availableData.push({x: Date.parse('2050-01-01T00:00:00.000'), y: availabilities[availabilities.length - 1].availableUnits})
        totalData.push({x: Date.parse('2050-01-01T00:00:00.000'), y: availabilities[availabilities.length - 1].totalUnits})
        this._options.series = [
            {name: flavour.name, data: totalData, color: '#b0b0ff', fillColor: '#fcfcff', lineWidth: 1, dashStyle: 'LongDash'},
            {name: flavour.name, data: availableData, color: '#00a65a', fillColor: '#edfbf1' },
        ];

    }

}
