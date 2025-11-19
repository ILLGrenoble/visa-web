
const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return { r, g, b };
}

const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export class HypervisorResourceChartData {


    private _options: any = {
        chart: {
            type: 'pie',
        },
        title: {
            text: '',
        },
        subtitle: {
            text: this.getSubtitle(),
            floating: true,
            useHTML: true,
            verticalAlign: 'middle',
            y: 12,
        },
        plotOptions: {
            series: {
                borderRadius: 0,
                allowPointSelect: false,
                // cursor: 'pointer',
                showInLegend: false,
                states: {
                    hover: {
                        enabled: false,
                    }
                }
            },
        },
        credits: {
            enabled: false,
        },
        tooltip: {
            enabled: false,
            // style: {
            //     backgroundColor: '#ffffff',
            //     fontSize: '12px',
            // },
            // formatter: function () {
            //     return `<span>${this.series.name}<br>${this.key}: <b>${this.y}</b></span>`;
            // },
            // useHTML: true,
        },
        series: [{
            type: 'pie',
            colorByPoint: true,
            allowPointSelect: false,
            innerSize: '75%',
            borderColor: '#cccccc',
            dataLabels: {
                enabled: false
            },
            data: [],
        }],
    }

    get options(): any {
        return this._options;
    }

    constructor(private _resource: string, private _total: number, private _used: number, private _enabled: boolean) {
        this._options.series[0] = {
            ...this._options.series[0],
            name: this._resource,
            data: [
                { name: 'used', y: Math.floor(this._used), color: this.getSeverityColour(this._used / this._total)},
                { name: 'available', y: Math.floor(this._total - this._used), color: '#ffffff'},
            ]
        }
        this._options.series[0].borderColor = this._enabled ? '#cccccc' : '#dddddd';
    }

    private getSubtitle(): string {
        const extraStyle = this._enabled ? '' : 'chart-title-container__disabled';
        return `
            <div class="chart-title-container ${extraStyle}">
              <div class="chart-title-main">${this._resource}</div>
              <div class="chart-title-sub">${Math.floor(this._used)} / ${Math.floor(this._total)}</div>
            </div>
        `;
    }

    private getSeverityColour(value: number): string {
        if (!this._enabled) {
            return '#cccccc';
        }

        value = Math.max(0.0, Math.min(value, 1.0));

        const colours = [
            hex2rgb('#00a65a'),
            hex2rgb('#00a65a'),
            hex2rgb('#00a65a'),
            hex2rgb('#ffcc00'),
            hex2rgb('#ff9900'),
            hex2rgb('#dd4b39'),
            hex2rgb('#ff0000'),
        ]

        const i1 = Math.floor((colours.length - 1) * value);
        const i2 = Math.ceil((colours.length - 1) * value);

        const colourStep = 1.0 / (colours.length - 1);
        const diff = value - i1 * colourStep;

        const colour = {
            r: Math.floor(colours[i1].r + diff * (colours[i2].r - colours[i1].r)),
            g: Math.floor(colours[i1].g + diff * (colours[i2].g - colours[i1].g)),
            b: Math.floor(colours[i1].b + diff * (colours[i2].b - colours[i1].b)),
        }

        return rgbToHex(colour.r, colour.g, colour.b);
    }

}
