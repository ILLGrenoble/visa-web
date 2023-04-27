import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {AccountService, AnalyticsService, Instance} from '@core';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from 'environments/environment';

@Component({
    styleUrls: ['./jupyter.component.scss'],
    templateUrl: './jupyter.component.html',
})
export class JupyterComponent implements OnInit {

    @ViewChild('jupyter_iframe') jupyterIframe: ElementRef;

    private _instance: Instance;
    private _error: string = null;
    private _jupyterUrl: string = null;


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
    }

    private setInstance(instance: Instance): void {
        const title = `${instance.name} (${instance.id}) | Jupyter | VISA`;
        this.titleService.setTitle(title);
        this.analyticsService.trackPageView(title);
        this._instance = instance;

        const baseUrl = environment.paths.jupyter;
        this._jupyterUrl = `${baseUrl}/${instance.id}/lab`;
    }

    public handleConnect(): void {
        const instanceId = this.route.snapshot.paramMap.get('id');
        this.accountService.getInstance(instanceId).subscribe({
            next: (instance) => {
                this.setInstance(instance);
            },
            error: (error) => {
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
