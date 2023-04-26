import {Component, Input, Output} from '@angular/core';
import {Subject} from 'rxjs';

@Component({
    selector: 'visa-instance-stats',
    styleUrls: ['./stats.component.scss'],
    templateUrl: './stats.component.html',
})
export class StatsComponent {

    @Input()
    public totalDataReceived: number;

    @Input()
    public dataReceivedRate: number;

    @Input()
    public timeElapsed: number;

    // tslint:disable-next-line:no-output-native
    @Output()
    public close: Subject<null> = new Subject();

}
