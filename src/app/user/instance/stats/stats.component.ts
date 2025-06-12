import {Component, Input, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {VirtualDesktopManager} from "@vdi";

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

    @Input()
    public manager: VirtualDesktopManager;

    @Input()
    public isAdmin: boolean;

    // tslint:disable-next-line:no-output-native
    @Output()
    public close: Subject<null> = new Subject();

    public startConnectionTesting(): void {
        if (this.manager && this.isAdmin) {
            this.manager.startConnectionTesting().then(() => console.log(`Starting connection test`));
        }
    }

    public stopConnectionTesting(): void {
        if (this.manager && this.isAdmin) {
            this.manager.stopConnectionTesting().then(() => console.log(`Connection test stopped`));
        }
    }

    public isConnectionTestRunning(): boolean {
        if (this.manager && this.isAdmin) {
            return this.manager.isConnectionTestRunning();
        } else {
            return false;
        }
    }

    public isConnectionTestAvailable(): boolean {
        return this.manager && this.isAdmin;
    }

}
