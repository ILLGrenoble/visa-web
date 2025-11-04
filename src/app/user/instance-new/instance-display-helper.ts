export type ScreenResolution = { label?: string; width: number; height: number };
export type ScreenArrangement = { name: string; details: string; screens: number };

export class InstanceDisplayHelper {

    public static readonly USER_INSTANCE_VDI_PROTOCOL_KEY = 'user.instance.vdi.protocol';
    public static readonly USER_INSTANCE_SCREEN_WIDTH_KEY = 'user.instance.screen.width';
    public static readonly USER_INSTANCE_SCREEN_HEIGHT_KEY = 'user.instance.screen.height';
    public static readonly USER_INSTANCE_SCREEN_NUMBER_X_KEY = 'user.instance.screen.numberX';

    private _screenResolutions: ScreenResolution[] = [{
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

    private _arrangements: ScreenArrangement[] = [{
        name: 'Single screen',
        details: 'Default screen layout',
        screens: 1
    }, {
        name: 'Dual screen',
        details: 'Recommended for remote experiments',
        screens: 2
    }];

    private _defaultScreenResolution: ScreenResolution;
    private _defaultArrangement: ScreenArrangement;

    get screenResolutions(): ScreenResolution[] {
        return this._screenResolutions;
    }

    get arrangements(): ScreenArrangement[] {
        return this._arrangements;
    }

    get defaultScreenResolution(): ScreenResolution {
        return this._defaultScreenResolution;
    }

    get defaultArrangement(): ScreenArrangement {
        return this._defaultArrangement;
    }

    constructor() {
        const hostScreenResolution = this.getHostScreenResolution();
        if (this.findScreenResolution(hostScreenResolution.width, hostScreenResolution.height) == null) {
            this.screenResolutions.push(hostScreenResolution);
            this.screenResolutions.sort((resolution1, resolution2) => resolution2.width - resolution1.width);
        }

        const localScreenResolution = this.getLocalScreenResolution();
        if (localScreenResolution) {
            if (this.screenResolutions.find(screenResolution => screenResolution.height === localScreenResolution.height && screenResolution.width === localScreenResolution.width) == null) {
                this.screenResolutions.push(localScreenResolution);
                this.screenResolutions.sort((resolution1, resolution2) => resolution2.width - resolution1.width);
            }

            this._defaultScreenResolution = this.findScreenResolution(localScreenResolution.width, localScreenResolution.height);

        } else {
            this._defaultScreenResolution = this.findScreenResolution(hostScreenResolution.width, hostScreenResolution.height);
        }

        this._defaultArrangement = this.getLocalScreenArrangement();
    }

    private getHostScreenResolution(): ScreenResolution {
        const {width, height} = window.screen;
        return {
            label: `Host (${width} x ${height})`,
            width,
            height,
        };
    }

    private getLocalScreenResolution(): ScreenResolution {
        const localScreenWidthText = localStorage.getItem(InstanceDisplayHelper.USER_INSTANCE_SCREEN_WIDTH_KEY);
        const localScreenHeightText = localStorage.getItem(InstanceDisplayHelper.USER_INSTANCE_SCREEN_HEIGHT_KEY);

        if (localScreenWidthText && localScreenHeightText) {
            const width = +localScreenWidthText;
            const height = +localScreenHeightText;
            return {
                label: `Custom (${width} x ${height})`,
                width,
                height,
            };
        }

        return null;
    }

    private getLocalScreenArrangement(): ScreenArrangement {
        const localScreenNumberX = +localStorage.getItem(InstanceDisplayHelper.USER_INSTANCE_SCREEN_NUMBER_X_KEY);

        if (localScreenNumberX) {
            const arrangement = this._arrangements.find(arrangement => arrangement.screens == localScreenNumberX);
            if (arrangement) {
                return arrangement;
            }
        }

        return this.arrangements.find(arrangement => arrangement.screens === 1);
    }

    private findScreenResolution(width: number, height: number): ScreenResolution {
        return this._screenResolutions.find(screenResolution => screenResolution.height === height && screenResolution.width === width)
    }

}
