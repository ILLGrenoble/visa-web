import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {environment} from "environments/environment";
import {PrintJobAvailableEvent, PrintJobHandledEvent, VisaPrintService} from '@illgrenoble/visa-print-client';
import {VirtualDesktopManager} from "@vdi";
import {Instance} from "@core";
import {Subscription} from "rxjs";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {PrintRequestComponent} from "./print-request";

@Component({
    selector: 'visa-printer',
    templateUrl: './printer.component.html',
    styleUrls: ['./printer.component.scss'],
})
export class PrinterComponent implements OnInit, OnDestroy {

    private _manager: VirtualDesktopManager;
    private _instance: Instance;

    private _printerConnectionId: string;
    private _printerEnabled: boolean = true;

    private _managerState$: Subscription;

    private _state: 'UNAVAILABLE' | 'CONNECTING' | 'ENABLED' | 'DISABLED' | 'RECEIVING_DATA' | 'ERROR' = 'UNAVAILABLE';

    private _requestDialogs: MatDialogRef<PrintRequestComponent>[] = [];

    get manager(): VirtualDesktopManager {
        return this._manager;
    }

    @Input()
    set manager(value: VirtualDesktopManager) {
        this._manager = value;
    }

    get instance(): Instance {
        return this._instance;
    }

    @Input()
    set instance(value: Instance) {
        this._instance = value;
    }

    get state(): 'UNAVAILABLE' | 'CONNECTING' | 'ENABLED' | 'DISABLED' | 'RECEIVING_DATA' | 'ERROR' {
        return this._state;
    }

    constructor(private _printService: VisaPrintService,
                private _dialog: MatDialog) {
    }

    public ngOnInit(): void {
        this.handleState();
    }

    public ngOnDestroy() {
        this.disconnectPrinter();
        if (this._managerState$) {
            this._managerState$.unsubscribe();
            this._managerState$ = null;
        }
    }

    private handleState(): void {
        this._managerState$ = this._manager.onStateChange.subscribe((state) => {
            if (state === 'DISCONNECTED') {
                this.disconnectPrinter();

            } else if (state === 'CONNECTED') {
                this.connectPrinter();
            }
        });
    }

    public connectPrinter(): void {
        if (this.instance.membership.role === 'OWNER') {
            this._state = 'CONNECTING';
            this._printService.connect({path: `${environment.paths.print}/${this.instance.id}`, token: this.instance.computeId}).subscribe(event => {
                // console.log(event.type);
                if (event.type === 'CONNECTED') {
                    this._printerConnectionId = event.connectionId;

                    if (this._printerEnabled) {
                        this._printService.enablePrinting(this._printerConnectionId);
                    }

                } else if (event.type === 'PRINT_ENABLED') {
                    this._state = 'ENABLED';

                } else if (event.type === 'PRINT_DISABLED') {
                    this._state = 'DISABLED';

                } else if (event.type === 'ERROR') {
                    this._state = 'ERROR';

                } else if (event.type === 'PRINT_JOB_CHUNK_RECEIVED') {
                    this._state = 'RECEIVING_DATA';

                } else if (event.type === 'PRINT_JOB_HANDLED') {
                    const printJob = event.data as PrintJobHandledEvent;
                    const id = `${event.connectionId}-${printJob.jobId}`;
                    const dialog = this._requestDialogs.find(dialog => dialog.id === id);
                    if (dialog) {
                        dialog.close(false);
                    }

                    this._requestDialogs = this._requestDialogs.filter(dialog => dialog.id !== id);

                } else if (event.type === 'PRINT_JOB_AVAILABLE') {
                    this._state = 'ENABLED';

                    const printJob = event.data as PrintJobAvailableEvent;
                    const id = `${event.connectionId}-${printJob.jobId}`;
                    const dialog = this._dialog.open(PrintRequestComponent, {
                        height: 'auto',
                        width: '480px',
                        id
                    });
                    this._requestDialogs.push(dialog);

                    dialog.afterClosed().subscribe((accepted) => {
                        if (accepted) {
                            this._printService.openPrintable(event.connectionId, printJob.jobId);
                        }
                    });

                }
            });
        }
    }

    public disconnectPrinter(): void {
        if (this._printerConnectionId) {
            this._printService.disconnect(this._printerConnectionId);
            this._printerConnectionId = null;
        }
    }

    public togglePrinterEnabled(): void {
        // if (this._printerConnectionId) {
        //     this._printerEnabled = !this._printerEnabled;
        //     if (this._printerEnabled) {
        //         this._printService.enablePrinting(this._printerConnectionId);
        //     } else {
        //         this._printService.disablePrinting(this._printerConnectionId);
        //     }
        // }
    }

    public isPrinterAvailable(): boolean {
        return this._instance?.membership.role === 'OWNER' && this._instance?.hasProtocolWithName('VISA_PRINT');
    }

    public isPrinterEnabled(): boolean {
        return this._printerEnabled;
    }

    public isPrinterConnected(): boolean {
        return this._printerConnectionId != null;
    }

}
