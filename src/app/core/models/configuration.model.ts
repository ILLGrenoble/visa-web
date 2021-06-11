import {KeycloakConfig} from 'keycloak-js';

export class Configuration {

    public version: string = undefined;
    public login: KeycloakConfig = undefined;
    public contactEmail: string = undefined;

    public analytics: { enabled: boolean; url?: string; siteId?: number };

    public desktop: {
        allowedClipboardUrlHosts: { host: string, https: boolean }[]
        keyboardLayouts: { layout: string, name: string, selected: boolean }[];
    };


    public metadata: { [key: string]: string };

    constructor() {
    }

}
