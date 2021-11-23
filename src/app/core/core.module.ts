import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {APOLLO_OPTIONS} from 'apollo-angular';
import {HttpLink, HttpLinkModule} from 'apollo-angular-link-http';
import {environment} from 'environments/environment';
import {AccountEffects} from './effects';
import {AuthenticationGuard} from './guards';
import {accountReducer} from './reducers';
import {
    AccountExperimentCountResolver,
    AccountInstanceCountResolver,
    AccountInstanceExperimentsResolver,
    AccountQuotaResolver
} from './resolvers';
import {
    AccountService,
    AnalyticsService,
    AuthenticationService,
    CatalogueService,
    ConfigService,
    configServiceInitializerFactory,
    DocumentationService,
    HelperService,
    InstrumentService,
    NotificationService,
    ObjectMapperService,
} from './services';
import {OAuthModule} from 'angular-oauth2-oidc';
import {InMemoryCache} from '@apollo/client/core';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        OAuthModule.forRoot(
            {
                resourceServer: {
                    sendAccessToken: true,
                    customUrlValidation: (url) => {
                        const excludedUrls = ['/api/docs/(.*)+', '/api/configuration', '/api/notifications'];
                        for (const excludedUrl of excludedUrls) {
                            if (url.match(excludedUrl)) {
                                return false;
                            }
                        }
                        return true;
                    }
                }
            }
        ),
        HttpLinkModule,
        StoreModule.forRoot({account: accountReducer}),
        EffectsModule.forRoot([AccountEffects]),
    ],
    providers: [
        AccountService,
        CatalogueService,
        AnalyticsService,
        HelperService,
        InstrumentService,
        ObjectMapperService,
        ConfigService,
        NotificationService,
        AccountQuotaResolver,
        AccountExperimentCountResolver,
        AccountInstanceCountResolver,
        AccountInstanceExperimentsResolver,
        DocumentationService,
        AuthenticationGuard,
        {
            provide: APP_INITIALIZER,
            useFactory: configServiceInitializerFactory,
            deps: [ConfigService],
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: function initializer(authenticationService: AuthenticationService): () => Promise<any> {
                return authenticationService.init();
            },
            multi: true,
            deps: [AuthenticationService],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: function initializer(analyticsService: AnalyticsService): () => Promise<any> {
                return analyticsService.init();
            },
            deps: [AnalyticsService],
            multi: true,
        },
        {
            provide: APOLLO_OPTIONS,
            useFactory: (httpLink: HttpLink) => {
                return {
                    cache: new InMemoryCache(),
                    defaultOptions: {
                        watchQuery: {
                            fetchPolicy: 'no-cache',
                            errorPolicy: 'ignore',
                        },
                        query: {
                            fetchPolicy: 'no-cache',
                            errorPolicy: 'all',
                        },
                    },
                    link: httpLink.create({
                        uri: `${window.location.origin}${environment.paths.graphql}`,
                        withCredentials: true,
                    }),
                };
            },
            deps: [HttpLink],
        },

    ],
    exports: [],
})
export class CoreModule {

}
