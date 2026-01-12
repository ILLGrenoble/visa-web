import {BookingRequest, Flavour, FlavourAvailability} from "../../../core/graphql";
import {BehaviorSubject} from "rxjs";
import * as moment from "moment/moment";

const colours = [
    '#e83f0b',
    '#3366E6',
    '#9e1d77',
    '#1a97b3',
    '#B34D4D',
    '#222bd3',
    '#B366CC',
    '#B33300',
    '#4DB3FF',
    '#1a98ff',
    '#66664D',
    '#CC80CC',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
]

const hexToRgba = (hex, alpha = 1) => {
    const cleanHex = hex.replace('#', '');

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class AvailabilityChartData {

    private _options: any = {
        chart: {
            type: 'area',
            zoomType: this._axisData$ ? 'x' : null,
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
            },
            plotBands: [],
            plotLines: [],
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
                // const date = new Date(availableData.x).toLocaleDateString('en-UK');
                const date = moment(new Date(availableData.x)).format('DD/MM/YYYY HH:mm')
                return `<span style="font-size: 0.7em;">${date}</span><br/><span style="font-size: 0.8em;">${availableData.series.name}</span><br/>${details}`;
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

    constructor(flavour: Flavour, availabilities: FlavourAvailability[], private _axisData$: BehaviorSubject<{min: number, max: number}>, bookings: BookingRequest[], showUncertaintyRegion: boolean) {
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

        this.addRegions(showUncertaintyRegion ? availabilities : null, bookings);

        availableData.push({x: Date.parse('2050-01-01T00:00:00.000'), y: availabilities[availabilities.length - 1].availableUnits});
        totalData.push({x: Date.parse('2050-01-01T00:00:00.000'), y: availabilities[availabilities.length - 1].totalUnits})
        this._options.series = [
            {name: flavour.name, data: totalData, color: '#b0b0ff', fillColor: '#fcfcff', lineWidth: 1, dashStyle: 'LongDash'},
            {name: flavour.name, data: availableData, color: '#00a65a', fillColor: '#f8fffa'},
        ];
    }

    private addRegions(availabilities: FlavourAvailability[], bookings: BookingRequest[]): void {
        const uncertaintyStart = availabilities?.find(availability => availability.confidence === 'UNCERTAIN');
        let index = 4;

        if (uncertaintyStart) {
            this._options.xAxis.plotBands.push({
                color: 'rgba(0, 0, 0, 0.04)',
                from: Date.parse(uncertaintyStart.date),
                to: Date.parse('2050-01-01T00:00:00.000'),
                zIndex: index,
                label: {
                    text: 'Availabilities cannot be calculated with certainty',
                    style: {
                        fontSize: 12,
                        color: '#7a7a7a',
                    },
                    align: 'left',
                    x: 8,
                },
            });
            this._options.xAxis.plotLines.push({
                dashStyle: 'dash',
                color: '#aaa',
                width: 2,
                value: Date.parse(uncertaintyStart.date),
                zIndex: index,
            })
            index++;
        }

        if (bookings) {

            for (const [i, booking] of bookings.entries()) {
                const color = colours[i];
                this._options.xAxis.plotBands.push({
                    color: hexToRgba(color, 0.2),
                    from: Date.parse(booking.startDate),
                    to: new Date (Date.parse(booking.endDate) + 24 * 60 * 60 * 1000).getTime(),
                    zIndex: index,
                    label: {
                        text: booking.name,
                        verticalAlign: 'bottom',
                        style: {
                            fontSize: 12,
                            color: color
                        },
                    }
                });
                this._options.xAxis.plotLines.push({
                    dashStyle: 'solid',
                    color: hexToRgba(color, 0.5),
                    width: 1,
                    value: Date.parse(booking.startDate),
                    zIndex: index,
                })
                this._options.xAxis.plotLines.push({
                    dashStyle: 'solid',
                    color: hexToRgba(color, 0.5),
                    width: 1,
                    value: new Date (Date.parse(booking.endDate) + 24 * 60 * 60 * 1000).getTime(),
                    zIndex: index,
                })
                index++;
            }
        }
    }

}
