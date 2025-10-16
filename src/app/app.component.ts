import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigService, Configuration} from '@core';
import {EMPTY, from, Observable, Subject, timer} from 'rxjs';
import {catchError, delay, distinctUntilChanged, map, retryWhen, share, switchMap, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-main',
    template: `
        <div>
            <router-outlet></router-outlet>
        </div>
    `,
})
export class AppComponent implements OnInit, OnDestroy {

    private _currentVersion: string = null;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    set currentVersion(value: string) {
        this._currentVersion = value;
    }

    get currentVersion(): string {
        return this._currentVersion;
    }

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    constructor(private configService: ConfigService) {

    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    public ngOnInit(): void {
        timer(0, 120000).pipe(
            switchMap(() => this.checkForApplicationVersion()),
            map((configuration) => configuration.version),
            share(),
            retryWhen((errors) => errors.pipe(delay(30000))),
            takeUntil(this.destroy$),
            catchError(() => {
                return EMPTY;
            }),
            distinctUntilChanged(),
        ).subscribe(this.handleApplicationVersion.bind(this));
    }

    private handleApplicationVersion(version: string): void {
        if (this.isNewVersionAvailable(version)) {
            location.reload();
        }
        this.currentVersion = version;
    }

    private checkForApplicationVersion(): Observable<Configuration> {
        return from(this.configService.reload());
    }

    private isNewVersionAvailable(version: string): boolean {
        return !(!this.currentVersion || this.currentVersion === version);
    }
}
