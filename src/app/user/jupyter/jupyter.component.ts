import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {AccountService, AnalyticsService, Instance} from '@core';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from 'environments/environment';
import {switchMap, takeUntil, takeWhile} from "rxjs/operators";
import {Subject, timer} from "rxjs";

@Component({
    styleUrls: ['./jupyter.component.scss'],
    templateUrl: './jupyter.component.html',
})
export class JupyterComponent implements OnInit, OnDestroy {

    @ViewChild('jupyter_iframe') jupyterIframe: ElementRef;

    private _instance: Instance;
    private _error: string = null;
    private _jupyterUrl: string = null;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get instance(): Instance {
        return this._instance;
    }

    get error(): string {
        return this._error;
    }

    get jupyterUrl(): string {
        return this._jupyterUrl;
    }

    constructor(private route: ActivatedRoute,
                private router: Router,
                private accountService: AccountService,
                private analyticsService: AnalyticsService,
                private titleService: Title) {

    }

    public ngOnInit(): void {
        this.handleConnect();

        timer(0, 60000)
            .pipe(
                takeUntil(this._destroy$),
            )
            .subscribe(() => {
                this.verifyInstance();
            });
    }

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    private setInstance(instance: Instance): void {
        if (instance != null) {
            const title = `${instance.name} (${instance.id}) | Jupyter | VISA`;
            this.titleService.setTitle(title);
            this.analyticsService.trackPageView(title);
            this._instance = instance;

            const baseUrl = environment.paths.jupyter;
            this._jupyterUrl = `${baseUrl}/${instance.id}/lab`;

        } else {
            this._instance = null;
            this._jupyterUrl = null;
        }
    }

    public handleConnect(): void {
        const instanceId = this.route.snapshot.paramMap.get('id');
        this.updateInstance(instanceId);
    }

    private verifyInstance(): void {
        if (!this._instance) {
            return;
        }
        this.updateInstance(this._instance.uid);
    }

    private updateInstance(uid: string): void {
        this.accountService.getInstance(uid).subscribe({
            next: (instance) => {
                this.setInstance(instance);
            },
            error: (error) => {
                this.setInstance(null);
                if (error.status === 404) {
                    this._error = 'The requested instance does not exist';

                } else {
                    this._error = 'Failed to connect to the instance';
                }
            }
        });
    }

    public resizeJupyter(retry?: number): void {
        retry = retry || 0;
        let jupyterMain;
        if (this.jupyterIframe) {
            jupyterMain = this.jupyterIframe.nativeElement.contentWindow.document.getElementById('main');
        }
        if (this.jupyterIframe == null || jupyterMain == null) {
            if (retry < 50) {
                setTimeout(() => {
                    this.resizeJupyter.call(this, ++retry);
                }, 200);
            }
        } else {
            jupyterMain.style.height = '100vh';
        }
    }

}
