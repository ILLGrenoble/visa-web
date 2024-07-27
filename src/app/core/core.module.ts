import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {APOLLO_OPTIONS, ApolloModule} from 'apollo-angular';
import {HttpLink} from 'apollo-angular/http';
import {environment} from 'environments/environment';
import {AccountEffects} from './effects';
import {accountReducer, notificationsReducer} from './reducers';
import {
    AccountService,
    AnalyticsService, analyticsServiceInitializerFactory,
    AuthenticationService, authenticationServiceInitializerFactory,
    CatalogueService,
    ConfigService,
    configServiceInitializerFactory,
    DocumentationService, EventGateway, eventGatewayInitializerFactory,
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
        ApolloModule,
        StoreModule.forRoot({account: accountReducer, notifications: notificationsReducer}),
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
        EventGateway,
        NotificationService,
        DocumentationService,
        {
            provide: APP_INITIALIZER,
            useFactory: configServiceInitializerFactory,
            deps: [ConfigService],
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: authenticationServiceInitializerFactory,
            multi: true,
            deps: [AuthenticationService],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: eventGatewayInitializerFactory,
            multi: true,
            deps: [EventGateway],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: analyticsServiceInitializerFactory,
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
