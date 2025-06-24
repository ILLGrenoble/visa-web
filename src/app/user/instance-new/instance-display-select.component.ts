import {Component, OnDestroy, OnInit, Input, Output} from '@angular/core';
import {combineLatest, BehaviorSubject, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {Protocol, Plan} from "@core";

@Component({
    selector: 'visa-instance-display-select',
    templateUrl: './instance-display-select.component.html',
    styleUrls: ['./instance-display-select.component.scss'],
})
export class InstanceDisplaySelectComponent implements OnInit, OnDestroy {
    private static USER_INSTANCE_VDI_PROTOCOL_KEY = 'user.instance.vdi.protocol';

    public screenResolutions = [{
        label: 'WXGA (1280 x 720) 16:9',
        width: 1280,
        height: 720,
    }, {
        label: 'WXGA (1280 x 800) 16:10',
        width: 1280,
        height: 800,
    }, {
        label: 'SXGA (1280 x 1024) 5:4',
        width: 1280,
        height: 1024,
    }, {
        label: 'WXGA+ (1440 x 900) 16:10',
        width: 1440,
        height: 900,
    }, {
        label: 'HD+ (1600 x 900) 16:9',
        width: 1600,
        height: 900,
    }, {
        label: 'WSXGA+ (1680 x 1050) 16:10',
        width: 1680,
        height: 1050,
    }, {
        label: 'FHD (1920 x 1080) 16:9',
        width: 1920,
        height: 1080,
    }, {
        label: 'WUXGA (1920 x 1200) 16:10',
        width: 1920,
        height: 1200,
    }, {
        label: 'QHD (2560 x 1440) 16:9',
        width: 2560,
        height: 1440,
    }, {
        label: '4K UHD (3840 x 2160) 16:9',
        width: 3840,
        height: 2160,
    }];

    private _defaultDisplayWidth = 1920;
    private _availableVdiProtocols: Protocol[] = null;
    private _vdiProtocol$: BehaviorSubject<Protocol> = new BehaviorSubject(null);
    private _showAdvancedSettings = false;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _arrangements: { name: string; details: string; screens: number }[] = [];

    private _selectedSingleScreenResolution: BehaviorSubject<{ label: string; width: number; height: number }> =
        new BehaviorSubject<{ label: string; width: number; height: number }>(null);

    get availableVdiProtocols(): Protocol[] {
        return this._availableVdiProtocols;
    }

    @Input()
    set plan(plan: Plan) {
        this._availableVdiProtocols = plan?.image.availableVdiProtocols();
        const userPreferredProtocol = this._availableVdiProtocols?.find(protocol => protocol.name === localStorage.getItem(InstanceDisplaySelectComponent.USER_INSTANCE_VDI_PROTOCOL_KEY));
        if (userPreferredProtocol) {
            this._vdiProtocol$.next(userPreferredProtocol);
        } else {
            this._vdiProtocol$.next(plan?.image.defaultVdiProtocol ? this._availableVdiProtocols?.find(protocol => protocol.id === plan?.image.defaultVdiProtocol.id) : null);
        }
    }

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get arrangements(): ({ name: string; details: string; screens: number })[] {
        return this._arrangements;
    }

    set arrangements(value: ({ name: string; details: string; screens: number })[]) {
        this._arrangements = value;
    }

    public selectedArrangement: BehaviorSubject<{ screens: number; name: string; details: string; }> =
        new BehaviorSubject<{ screens: number; name: string; details: string; }>(null);

    get selectedSingleScreenResolution(): { label: string, width: number, height: number } {
        return this._selectedSingleScreenResolution.getValue();
    }

    set selectedSingleScreenResolution(value: { label: string, width: number, height: number }) {
        this._selectedSingleScreenResolution.next(value);
    }

    get vdiProtocol(): Protocol {
        return this._vdiProtocol$.getValue();
    }

    set vdiProtocol(value: Protocol) {
        this._vdiProtocol$.next(value);
        localStorage.setItem(InstanceDisplaySelectComponent.USER_INSTANCE_VDI_PROTOCOL_KEY, value.name);
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
    public resolution: Subject<{ width: number, height: number }> = new Subject<{ width: number, height: number }>();

    public ngOnInit(): void {
        this.arrangements = [{
            name: 'Single screen',
            details: 'Default screen layout',
            screens: 1
        }, {
            name: 'Dual screen',
            details: 'Recommended for remote experiments',
            screens: 2
        }];


        const hostScreenResolution = this.getHostScreenResolution();
        const standardScreenResolution = this.screenResolutions.find(screenResolution => {
            return screenResolution.height === hostScreenResolution.height && screenResolution.width === hostScreenResolution.width;
        });
        if (standardScreenResolution != null) {
            this.selectedSingleScreenResolution = standardScreenResolution;

        } else {
            this.selectedSingleScreenResolution = hostScreenResolution;
            this.screenResolutions.push(hostScreenResolution);
            this.screenResolutions.sort((resolution1, resolution2) => {
                if (resolution1.width > resolution2.width) {
                    return 1;
                }
                if (resolution1.width < resolution2.width) {
                    return -1;
                }
                return 0;
            });
        }

        combineLatest([this.selectedArrangement, this._selectedSingleScreenResolution]).pipe(
            takeUntil(this.destroy$),
            filter(([selectedArrangement, selectedSingleScreenResolution]) =>
                selectedArrangement != null && selectedSingleScreenResolution != null)
        ).subscribe(([arrangement, singleScreenResolution]) => {
            const singleScreenWidth = singleScreenResolution.width;
            const singleScreenAspectRatio = singleScreenResolution.width / singleScreenResolution.height;

            const displayWidth = Math.max(this._defaultDisplayWidth, singleScreenWidth);
            const multiScreenWidth = displayWidth * arrangement.screens;

            const screenResolution = {
                width: multiScreenWidth,
                height: (multiScreenWidth / arrangement.screens) / singleScreenAspectRatio
            };
            this.resolution.next(screenResolution);
        });
        this.selectedArrangement.next(this._arrangements[0]);
    }

    public getHostScreenResolution(): {  label: string, width: number, height: number } {
        return ((screen) => {
            const {width, height} = screen;
            return {
                label: `Host (${width} x ${height})`,
                width,
                height,
            };
        })(window.screen);
    }

    public handleSelectedArrangement(arrangement: { name: string; details: string; screens: number }): void {
        this.selectedArrangement.next(arrangement);
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    getProtocolDescription(protocol: Protocol): string {
        if (protocol.name === 'GUACD') {
            return 'Proven remote desktop protocol but can have noticeable latency and limited graphical quality';

        } else if (protocol.name === 'WEBX') {
            return 'Experimental remote desktop protocol with low latency and high graphical quality';
        }
        return null;
    }
}
