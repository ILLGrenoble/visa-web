import {Component, OnDestroy, OnInit, Input, Output} from '@angular/core';
import {combineLatest, BehaviorSubject, Subject, window} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {Protocol, Plan, ConfigService} from "@core";
import {InstanceDisplayHelper, ScreenArrangement, ScreenResolution} from "./instance-display-helper";

@Component({
    selector: 'visa-instance-display-select',
    templateUrl: './instance-display-select.component.html',
    styleUrls: ['./instance-display-select.component.scss'],
})
export class InstanceDisplaySelectComponent implements OnInit, OnDestroy {

    private _helper: InstanceDisplayHelper;
    private _availableVdiProtocols: Protocol[] = null;
    private _vdiProtocol$: BehaviorSubject<Protocol> = new BehaviorSubject(null);
    private _showAdvancedSettings = false;
    private _plan: Plan;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _selectedSingleScreenResolution: BehaviorSubject<ScreenResolution> = new BehaviorSubject<ScreenResolution>(null);
    private _selectedArrangement: BehaviorSubject<ScreenArrangement> = new BehaviorSubject<ScreenArrangement>(null);
    private _vdiProtocolLocalStorageKey: string = InstanceDisplayHelper.USER_INSTANCE_VDI_PROTOCOL_KEY;

    get availableVdiProtocols(): Protocol[] {
        return this._availableVdiProtocols;
    }

    @Input()
    set helper(helper: InstanceDisplayHelper) {
        this._helper = helper;
    }

    @Input()
    set plan(plan: Plan) {
        this._plan = plan;
        this._availableVdiProtocols = plan?.image.availableVdiProtocols();
        this._updateVdiProtocol();
    }

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get screenResolutions(): ScreenResolution[] {
        return this._helper.screenResolutions;
    }

    get arrangements(): ScreenArrangement[] {
        return this._helper.arrangements;
    }

    get selectedArrangement(): ScreenArrangement {
        return this._selectedArrangement.getValue();
    }

    set selectedArrangement(value: ScreenArrangement) {
        localStorage.setItem(InstanceDisplayHelper.USER_INSTANCE_SCREEN_NUMBER_X_KEY, `${value.screens}`);
        this._selectedArrangement.next(value);
    }

    get selectedSingleScreenResolution(): ScreenResolution{
        return this._selectedSingleScreenResolution.getValue();
    }

    set selectedSingleScreenResolution(value: ScreenResolution) {
        this._selectedSingleScreenResolution.next(value);
        localStorage.setItem(InstanceDisplayHelper.USER_INSTANCE_SCREEN_WIDTH_KEY, `${value.width}`);
        localStorage.setItem(InstanceDisplayHelper.USER_INSTANCE_SCREEN_HEIGHT_KEY, `${value.height}`);
    }

    get vdiProtocol(): Protocol {
        return this._vdiProtocol$.getValue();
    }

    set vdiProtocol(value: Protocol) {
        this._vdiProtocol$.next(value);
        localStorage.setItem(this._vdiProtocolLocalStorageKey, value.name);
    }

    get vdiProtocolChoiceAvailable(): boolean {
        return this._availableVdiProtocols != null && this._availableVdiProtocols.length > 1;
    }

    get showAdvancedSettings(): boolean {
        return this._showAdvancedSettings;
    }

    set showAdvancedSettings(value: boolean) {
        this._showAdvancedSettings = value;
    }

    @Output("vdiProtocol")
    get vdiProtocol$(): BehaviorSubject<Protocol> {
        return this._vdiProtocol$;
    }

    @Output()
    public resolution: Subject<ScreenResolution> = new Subject<ScreenResolution>();

    @Output()
    public arrangement: Subject<ScreenArrangement> = new Subject<ScreenArrangement>();

    constructor(private _configurationService: ConfigService) {
    }

    public ngOnInit(): void {
        this.selectedSingleScreenResolution = this._helper.defaultScreenResolution;
        this.selectedArrangement = this._helper.defaultArrangement;

        this._selectedSingleScreenResolution.pipe(
            takeUntil(this._destroy$),
            filter(selectedSingleScreenResolution => !!selectedSingleScreenResolution),
        ).subscribe(selectedSingleScreenResolution => {
            this.resolution.next(selectedSingleScreenResolution);
        })

        this._selectedArrangement.pipe(
            takeUntil(this._destroy$),
            filter(arrangement => !!arrangement),
        ).subscribe(arrangement => {
            this.arrangement.next(arrangement);
        })

        this._configurationService.configuration$()
            .pipe(takeUntil(this._destroy$))
            .subscribe((config) => {
                const vdiProtocolLocalStorageKey = config.metadata['VDI_LOCAL_STORAGE_KEY'];
                if (vdiProtocolLocalStorageKey != null) {
                    this._vdiProtocolLocalStorageKey = vdiProtocolLocalStorageKey;
                    localStorage.removeItem(InstanceDisplayHelper.USER_INSTANCE_VDI_PROTOCOL_KEY);
                    this._updateVdiProtocol();
                }
            });
    }

    public handleSelectedArrangement(arrangement: ScreenArrangement): void {
        this.selectedArrangement = arrangement;
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    getProtocolName(protocol: Protocol): string {
        if (protocol.name === 'GUACD') {
            return 'Guacamole';

        } else if (protocol.name === 'WEBX') {
            return 'WebX';
        }
        return protocol.name;
    }

    getProtocolDescription(protocol: Protocol): string {
        if (protocol.name === 'GUACD') {
            return 'Proven remote desktop protocol but can have noticeable latency and limited graphical quality';

        } else if (protocol.name === 'WEBX') {
            return 'Experimental remote desktop protocol with low latency and high graphical quality';
        }
        return null;
    }

    private _updateVdiProtocol(): void {
        const userPreferredProtocol = this._availableVdiProtocols?.find(protocol => protocol.name === localStorage.getItem(this._vdiProtocolLocalStorageKey));
        if (userPreferredProtocol) {
            this._vdiProtocol$.next(userPreferredProtocol);
        } else {
            this._vdiProtocol$.next(this._plan?.image.defaultVdiProtocol ? this._availableVdiProtocols?.find(protocol => protocol.id === this._plan?.image.defaultVdiProtocol.id) : null);
        }
    }
}
