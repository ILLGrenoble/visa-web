import {Component, OnDestroy, OnInit} from '@angular/core';
import {AnalyticsService, ApplicationState, ConfigService, DocumentationSection, selectLoggedInUser, User} from '@core';
import {Observable, Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {Store} from '@ngrx/store';
import {takeUntil} from "rxjs/operators";

@Component({
    selector: 'visa-documentation',
    styleUrls: ['./documentation.component.scss'],
    templateUrl: './documentation.component.html'
})
export class DocumentationComponent implements OnInit, OnDestroy {

    private _contactEmail;

    private _user$: Observable<User>;

    private _sections: Observable<DocumentationSection[]>;

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    public get sections(): Observable<DocumentationSection[]> {
        return this._sections;
    }

    public set sections(value: Observable<DocumentationSection[]>) {
        this._sections = value;
    }

    get contactEmail(): string {
        return this._contactEmail;
    }

    set contactEmail(value: string) {
        this._contactEmail = value;
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

        this.configService.load()
            .pipe(takeUntil(this._destroy$))
            .subscribe((config) => {
                this._contactEmail = config.contactEmail;
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

    public ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }
}
