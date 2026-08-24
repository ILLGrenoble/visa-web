import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {Instance} from 'app/core/graphql';
import gql from 'graphql-tag';
import {BehaviorSubject, sample, Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {InstanceSessionMember} from '../../../core/graphql';
import * as Highcharts from "highcharts";

interface Sample {
    date: string,
    mean: number,
    sd: number,
}

@Component({
    selector: 'visa-admin-instance-sessions',
    templateUrl: './instance-sessions.component.html',
    styleUrls: ['./instance-sessions.component.scss'],
})
export class InstanceSessionsComponent implements OnInit, OnDestroy {

    private _sessions: InstanceSessionMember[] = [];
    private _clientRttSamples: Map<number, Sample[]> = new Map();
    private _instanceRttSamples: Map<number, Sample[]> = new Map();

    private _instance: Instance;
    private _loading = true;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _refresh$: Subject<boolean> = new BehaviorSubject<boolean>(true);

    private _separateRTTCharts: boolean = true;

    private _highcharts: typeof Highcharts = Highcharts;

    private _chartDefaultOptions: any = {
        chart: {
            type: 'line',
            zoomType: 'x',
            panning: true,
            panKey: 'shift',
        },
        title: {
            style: {
              fontSize: 14,
                fontWeight: 'normal',
            },
            text: 'Instance and client network Round-Trip Times for each session',
        },
        subtitle: {
            style: {
                fontSize: 12,
                // fontWeight: 'normal',
            },
            text: 'Instances times in dark grey, client times are coloured'
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
        },
        credits: {
            enabled: false,
        },
        series: [],
    }

    private _chartOptions = {...this._chartDefaultOptions};

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get refresh$(): Subject<boolean> {
        return this._refresh$;
    }

    @Input('refresh')
    set refresh$(value: Subject<boolean>) {
        this._refresh$ = value;
    }

    get sessions(): InstanceSessionMember[] {
        return this._sessions;
    }

    set sessions(value: InstanceSessionMember[]) {
        this._sessions = value;
    }

    get loading(): boolean {
        return this._loading;
    }

    set loading(value: boolean) {
        this._loading = value;
    }

    @Input()
    public get instance(): Instance {
        return this._instance;
    }

    public set instance(instance: Instance) {
        this._instance = instance;
    }

    get highcharts(): typeof Highcharts {
        return this._highcharts;
    }

    get chartOptions(): any {
        return this._chartOptions;
    }

    get separateRTTCharts(): boolean {
        return this._separateRTTCharts;
    }

    set separateRTTCharts(value: boolean) {
        this._separateRTTCharts = value;
        this.createChartData();
    }

    constructor(private apollo: Apollo) {

    }

    public ngOnInit(): void {
        this._highcharts.setOptions({
            time: {useUTC: false},
        })

        this.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.loading = true;
            this.apollo.query<any>({
                query: gql`
                query Instance($id: Int!) {
                    instance(id: $id) {
                        sessions {
                            id
                            user {
                              id
                              firstName
                              lastName
                              fullName
                            }
                            createdAt
                            role
                            duration
                        }
                        rttSamples {
                            id
                            date
                            instanceSessionMemberId
                            samplePeriodMinutes
                            clientMeanRttMs
                            clientSdRttMs
                            clientRttSampleCount
                            instanceMeanRttMs
                            instanceSdRttMs
                            instanceRttSampleCount
                        }
                    }
                }
                `,
                variables: {
                    id: this.instance.id,
                },
            })
                .pipe(
                    takeUntil(this._destroy$),
                    map(({data}) => data.instance),
                    tap(() => this.loading = false),
                )
                .subscribe((instance: Instance) => {
                    this.sessions = instance.sessions;
                    const rttSamples = instance.rttSamples;
                    this._clientRttSamples = rttSamples.reduce((acc, sample) => {
                        let samples = acc.get(sample.instanceSessionMemberId);
                        if (samples == null) {
                            samples = [];
                            acc.set(sample.instanceSessionMemberId, samples);
                        }

                        const {date, clientMeanRttMs, clientSdRttMs} = sample;
                        samples.push({date, mean: clientMeanRttMs, sd: clientSdRttMs});

                        return acc;
                    }, new Map());

                    this._instanceRttSamples = rttSamples.reduce((acc, sample) => {
                        let samples = acc.get(sample.instanceSessionMemberId);
                        if (samples == null) {
                            samples = [];
                            acc.set(sample.instanceSessionMemberId, samples);
                        }

                        const {date, instanceMeanRttMs, instanceSdRttMs} = sample;
                        samples.push({date, mean: instanceMeanRttMs, sd: instanceSdRttMs});

                        return acc;
                    }, new Map());

                    this.createChartData();
                });
        });
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    private createChartData(): void {
        this._chartOptions = {...this._chartDefaultOptions};
        this._chartOptions.series = [];

        const clientRttAxis = this._separateRTTCharts ? 1 : 0;
        this._chartOptions.yAxis = this._separateRTTCharts ? [{
                title: {
                    text: 'Instance RTT / ms',
                },
                labels: {
                    style: {
                        fontSize: 12,
                        color: '#606060'
                    }
                },
            }, {
                title: {
                    text: 'Client RTT / ms',
                },
                opposite: true,
                labels: {
                    style: {
                        fontSize: 12,
                        color: '#606060'
                    }
                },
            }
            ] : [{
            title: {
                text: 'RTT / ms',
            },
            labels: {
                style: {
                    fontSize: 12,
                    color: '#606060'
                }
            },
        }, { title: ""}]

        this._instanceRttSamples.forEach((samples, instanceSessionMemberId) => {
            // samples = samples.splice(1);
            if (samples.length > 1) {
                const rttData = samples
                    .filter(sample => sample.mean != null)
                    .map(sample => {
                    return { x: Date.parse(sample.date), y: sample.mean };
                });
                this._chartOptions.series.push({ name: `Instance RTT (ms) for Session ${instanceSessionMemberId}`, data: rttData, type: 'line', showInLegend: false, color: '#444444', yAxis: 0 });
            }
        });

        this._clientRttSamples.forEach((samples, instanceSessionMemberId) => {
            // samples = samples.splice(1);
            if (samples.length > 1) {
                const rttData = samples
                    .filter(sample => sample.mean != null)
                    .map(sample => {
                        return { x: Date.parse(sample.date), y: sample.mean };
                    });
                this._chartOptions.series.push({ name: `Client RTT (ms) for Session ${instanceSessionMemberId}`, data: rttData, type: 'line', showInLegend: false, yAxis: clientRttAxis });
            }
        });

    }

}
