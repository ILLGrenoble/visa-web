export type ScreenResolution = { label?: string; width: number; height: number };
export type ScreenArrangement = { name: string; details: string; screens: number };

export class InstanceDisplayHelper {

    public static readonly USER_INSTANCE_VDI_PROTOCOL_KEY = 'user.instance.vdi.protocol';
    public static readonly USER_INSTANCE_SCREEN_WIDTH_KEY = 'user.instance.screen.width';
    public static readonly USER_INSTANCE_SCREEN_HEIGHT_KEY = 'user.instance.screen.height';
    public static readonly USER_INSTANCE_SCREEN_NUMBER_X_KEY = 'user.instance.screen.numberX';

    private _baseScreenResolutions: ScreenResolution[] = [{
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

    private _screenResolutions: ScreenResolution[] = this._baseScreenResolutions.map(screenResolution => screenResolution);

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

    get baseScreenResolutions(): ScreenResolution[] {
        return this._baseScreenResolutions;
    }

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
        const localScreenResolution = this.getLocalScreenResolution();
        if (localScreenResolution) {
            this._defaultScreenResolution = this.findClosestScreenResolution(localScreenResolution);

        } else {
            this._defaultScreenResolution = this.findClosestScreenResolution(hostScreenResolution);
        }

        this._defaultArrangement = this.getLocalScreenArrangement();
    }

    private getHostScreenResolution(): ScreenResolution {
        // Note that if scaling is being done on firefox, the screen resolution is incorrect. For this reason we now find the closest matching resolution rather than a precise one.
        let {width, height} = window.screen;

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

    private findClosestScreenResolution(target: {width: number, height: number}): ScreenResolution {
        const targetAspect = target.width / target.height;

        return this._screenResolutions.reduce((best, current) => {
            const currentAspect = current.width / current.height;
            const bestAspect = best.width / best.height;

            const currentScore =
                Math.abs(current.width - target.width) +
                Math.abs(current.height - target.height) +
                Math.abs(currentAspect - targetAspect) * 1000;

            const bestScore =
                Math.abs(best.width - target.width) +
                Math.abs(best.height - target.height) +
                Math.abs(bestAspect - targetAspect) * 1000;

            return currentScore < bestScore ? current : best;
        }, this._screenResolutions[0]);
    }

}
