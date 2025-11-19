import {Flavour} from "../../../core/graphql";

export type FlavourStats = {
    flavour: Flavour;
    used: number;
    available: number;
}

export class HypervisorFlavoursChartData {


    private _options: any = {
        chart: {
            // plotBackgroundColor: null,
            // plotBorderWidth: null,
            plotShadow: false,
            type: 'bar',
        },
        title: {
            text: '',
        },
        xAxis: {
            categories: [],
            labels: {
                style: {
                    fontSize: '11px',
                    color: '#606060',
                },
            },
            gridLineWidth: 0,
        },
        yAxis: {
            title: {
                text: '',
            },
            labels: {
                enabled: false,
            },
            gridLineWidth: 0,
        },
        tooltip: {
            backgroundColor: '#ffffff',
            style: {
                fontSize: '12px',
            },
            formatter: function () {
                return `<span>${this.key}<br>${this.series.name}: <b>${this.y}</b></span>`;
            }
        },
        plotOptions: {
            series: {
                borderRadius: 0,
                borderColor: '#cccccc',
                stacking: 'normal',
                groupPadding: 0,
                pointWidth: 15,
                dataLabels: {
                    enabled: true,
                    style: {
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'normal',
                        textOutline: 'none',
                    }
                },
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

    constructor(private flavourStats: FlavourStats[], private _enabled: boolean) {
        this._options.xAxis.categories = flavourStats.map(flavourStat => flavourStat.flavour.name);
        this._options.xAxis.labels.style.color = this._enabled ? '#606060' : '#c0c0c0';
        const usedData = flavourStats.map(flavourStat => {
            return {y: flavourStat.used}
        });
        const availableData = flavourStats.map(flavourStat => {
            return {y: flavourStat.available}
        });
        this._options.series = [
            {name: 'Available instances', data: availableData, color: '#ffffff', dataLabels: {style: {color: this._enabled ? '#606060' : '#c0c0c0'}}},
            {name: 'Current instances', data: usedData, color: this._enabled ? '#808080' : '#cccccc', dataLabels: {style: {color: '#ffffff'}}},
        ]
    }

}
