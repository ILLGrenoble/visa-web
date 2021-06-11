import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FrontMatterResult} from 'front-matter';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {Title} from '@angular/platform-browser';
import {AnalyticsService} from '@core';

@Component({
    selector: 'visa-documentation',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./documentation-page.component.scss'],
    templateUrl: './documentation-page.component.html'
})
export class DocumentationPageComponent implements OnInit {

    private _page: FrontMatterResult<any>;

    public get page(): FrontMatterResult<any> {
        return this._page;
    }

    public set page(value: FrontMatterResult<any>) {
        this._page = value;
    }

    constructor(private route: ActivatedRoute,
                private router: Router,
                private titleService: Title,
                private analyticsService: AnalyticsService) {
    }

    refresh(): void {
        this.router.navigated = false;
        this.router.navigate([this.router.url]).then(_ => {
            this.page = this.route.snapshot.data.page;
        });
    }

    isProduction(): boolean {
        return environment.production;
    }

    ngOnInit(): void {
        this.page = this.route.snapshot.data.page;
        const title = `${this.page.attributes.title} | Help | VISA`;
        this.titleService.setTitle(title);
        this.analyticsService.trackPageView(title);
    }
}
