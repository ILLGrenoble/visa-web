import {HttpClient} from '@angular/common/http';
import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Observable, Subject, timer} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'visa-image',
    template: `<img *ngIf="src" [src]="src"/>`,
    encapsulation: ViewEncapsulation.None,
    styles: ['img { max-width: 100%; max-height: 100%; display: block; object-fit: contain }'],
})
export class ImageComponent implements OnInit, OnDestroy {

    private _url;

    private _src: SafeUrl | string;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private _repeat = true;

    private _refreshInterval = 5000;

    private _objectUrl: string = null;

    public get destroy$(): Subject<boolean> {
        return this._destroy$;
    }

    public set destroy$(value: Subject<boolean>) {
        this._destroy$ = value;
    }

    get src(): SafeUrl | string {
        return this._src;
    }

    set src(value: SafeUrl | string) {
        this._src = value;
    }

    @Input('url')
    set url(value) {
        this._url = value;
    }

    get url(): string {
        return this._url;
    }

    get refreshable(): boolean {
        return this._repeat;
    }

    @Input('refreshable')
    set refreshable(value: boolean) {
        this._repeat = value;
    }

    get refreshInterval(): number {
        return this._refreshInterval;
    }

    @Input('refreshInterval')
    set refreshInterval(value: number) {
        this._refreshInterval = value;
    }

    get objectUrl(): string {
        return this._objectUrl;
    }

    set objectUrl(value: string) {
        this._objectUrl = value;
    }

    constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    }

    public ngOnInit(): void {
        this.createTimer()
            .pipe(
                takeUntil(this.destroy$), switchMap(() => {
                    return this.http.get(this.url, {
                        responseType: 'blob',
                    });
                }))
            .subscribe((blob: Blob) => {
                this.revokeObjectUrl();
                this.objectUrl = URL.createObjectURL(blob);
                this.src = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
            });
    }

    public createTimer(): Observable<number> {
        if (this.refreshable) {
            return timer(0, this.refreshInterval);
        }
        return timer(0);
    }

    private revokeObjectUrl(): void {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }

    public ngOnDestroy(): void {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
        this.revokeObjectUrl();
    }
}
