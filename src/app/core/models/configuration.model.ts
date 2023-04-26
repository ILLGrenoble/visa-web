export class Configuration {

    public version: string = undefined;
    public login: {
        issuer: string,
        clientId: string,
        scope: string,
        showDebugInformation: boolean,
        sessionChecksEnabled: boolean
    };

    public contactEmail: string = undefined;

    public analytics: { enabled: boolean; url?: string; siteId?: number };

    public desktop: {
        allowedClipboardUrlHosts: { host: string, https: boolean }[]
        keyboardLayouts: { layout: string, name: string, selected: boolean }[];
    };

    public experiments: {
        openDataIncluded: boolean,
    };

    public metadata: { [key: string]: string };
}
