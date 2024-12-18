import {Injectable} from '@angular/core';
import {ConfigService} from './config.service';
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

declare let window: {
    [key: string]: any;
    prototype: Window;
    new(): Window;
};

export function analyticsServiceInitializerFactory(analyticsService: AnalyticsService): () => Observable<void> {
    return () => analyticsService.init();
}

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {

    private enabled = false;

    constructor(private configService: ConfigService) {
        window._paq = window._paq || [];
    }

    public init(): Observable<void> {
        return this.configService.configuration$().pipe(
            map(config => {
                const analytics = config.analytics;
                const {enabled, url, siteId} = analytics;
                if (enabled) {
                    this.enabled = true;
                    window._paq.push(['trackPageView']);
                    window._paq.push(['enableLinkTracking']);
                    (() => {
                        window._paq.push(['setTrackerUrl', `${url}/piwik.php`]);
                        window._paq.push(['setSiteId', siteId.toString()]);
                        const d = document;
                        const g = d.createElement('script');
                        const s = d.getElementsByTagName('script')[0];
                        g.type = 'text/javascript';
                        g.async = true;
                        g.defer = true;
                        g.src = `${url}/piwik.js`;
                        s.parentNode.insertBefore(g, s);
                    })();

                } else {
                    console.warn('Analytics is not enabled');
                }
            })
        );
    }

    /**
     * Logs a visit to this page.
     *
     * @param [customTitle] Optional title of the visited page.
     */
    public trackPageView(customTitle?: string): void {
        if (this.enabled) {
            try {
                const args: any[] = [];
                if (customTitle) {
                    args.push(customTitle);
                }
                // @ts-ignore
                window._paq.push(['setCustomUrl', window.location.href]);
                // @ts-ignore
                window._paq.push(['trackPageView', ...args]);
            } catch (exception) {
                if (!(exception instanceof ReferenceError)) {
                    throw exception;
                }
            }
        }
    }

    /**
     * Logs an event with an event category
     *
     * @param category Category of the event.
     * @param action Action of the event.
     * @param [name] Optional name of the event.
     * @param [value] Optional value for the event.
     */
    public trackEvent(category: string, action: string, name?: string, value?: number): void {
        if (this.enabled) {
            try {
                const args: any[] = [category, action];
                if (name) {
                    args.push(name);
                }
                if (typeof value === 'number') {
                    args.push(value);
                }
                // @ts-ignore
                window._paq.push(['trackEvent', ...args]);
            } catch (exception) {
                if (!(exception instanceof ReferenceError)) {
                    throw exception;
                }
            }
        }
    }

}
