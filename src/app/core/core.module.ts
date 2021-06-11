import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {APOLLO_OPTIONS, ApolloModule} from 'apollo-angular';
import {HttpLink, HttpLinkModule} from 'apollo-angular-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {environment} from 'environments/environment';
import {KeycloakAngularModule} from 'keycloak-angular';
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

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        KeycloakAngularModule,
        ApolloModule,
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
        AuthenticationService,
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
                return authenticationService.initialiseKeycloak();
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
