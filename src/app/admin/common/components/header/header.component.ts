import {Component, OnDestroy, OnInit, Output} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {Subject, timer} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-admin-header',
    templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit , OnDestroy{

    private static REFRESH_DASHBOARD_KEY = 'admin.header.refreshDashboard';

    @Output()
    private _refresh$: Subject<void> = new Subject<void>();

    private _autoRefresh = false;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get autoRefresh(): boolean {
        return this._autoRefresh;
    }

    set autoRefresh(autoRefresh: boolean) {
        this._autoRefresh = autoRefresh;
        localStorage.setItem(HeaderComponent.REFRESH_DASHBOARD_KEY, autoRefresh ? 'true' : 'false');
    }

    @Output('refresh')
    get refresh$(): Subject<void> {
        return this._refresh$;
    }

    set refresh$(value: Subject<void>) {
        this._refresh$ = value;
    }

    constructor(private router: Router, private titleService: Title) {
        this.router = router;
    }

    public handleRefresh(): void {
        this.refresh$.next();
    }

    public isRouteActive(url: string): boolean {
        return this.router.url.split('?')[0] === url;
    }

    public routeStartsWith(url: string): boolean {
        const urlBase = this.router.url.split('?')[0];
        return urlBase.startsWith(url);
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public ngOnInit(): void {
        if (!this.titleService.getTitle().endsWith(`Admin | VISA`)) {
            this.titleService.setTitle(`Admin | VISA`);
        }
        this._autoRefresh = (localStorage.getItem(HeaderComponent.REFRESH_DASHBOARD_KEY) === 'true');

        timer(1, 30000)
            .pipe(
                takeUntil(this.destroy$),
                filter(() => this.autoRefresh),
            )
            .subscribe(() => this.refresh$.next());
    }
}
