import {Component, OnInit} from '@angular/core';
import {AnalyticsService, ApplicationState, ConfigService, DocumentationSection, selectLoggedInUser, User} from '@core';
import {Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {Store} from '@ngrx/store';

@Component({
    selector: 'visa-documentation',
    styleUrls: ['./documentation.component.scss'],
    templateUrl: './documentation.component.html'
})
export class DocumentationComponent implements OnInit {
    
    public contactEmail;

    private _user$: Observable<User>;

    private _sections: Observable<DocumentationSection[]>;

    public get sections(): Observable<DocumentationSection[]> {
        return this._sections;
    }

    public set sections(value: Observable<DocumentationSection[]>) {
        this._sections = value;
    }

    get user$(): Observable<User> {
        return this._user$;
    }

    set user$(value: Observable<User>) {
        this._user$ = value;
    }

    constructor(private route: ActivatedRoute,
                private titleService: Title,
                private analyticsService: AnalyticsService,
                private store: Store<ApplicationState>,
                private configService: ConfigService) {
        this.user$ = store.select(selectLoggedInUser);
    }

    ngOnInit(): void {
        const title = `Help | VISA`;
        this.titleService.setTitle(title);
        this.analyticsService.trackPageView(title);

        this.configService.load().then(config => {
            this.contactEmail = config.contactEmail;
        });

        this._user$.subscribe(user => {
            // Remove any items that are not valid for the roles of the user
            this.sections = this.route.snapshot.data.sections.map((section: DocumentationSection) => {
                section.items = section.items.filter(item => {
                    return item.roles == null || (user != null && user.hasAnyRole(item.roles));
                });
                return section;
            });
        });

    }

}
