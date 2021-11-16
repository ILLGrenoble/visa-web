import {RouterModule, Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {DocumentationPageComponent} from './documentation-page.component';
import {DocumentationPageResolver} from './documentation-page.resolver';
import {DocumentationComponent} from './documentation.component';
import {DocumentationResolver} from './documentation.resolver';

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: '',
                component: DocumentationComponent,
                resolve: {sections: DocumentationResolver},
            },
            {
                path: ':section/:page',
                component: DocumentationPageComponent,
                runGuardsAndResolvers: 'always',
                resolve: {page: DocumentationPageResolver},
            },
        ],
    },
];

export const ROUTING = RouterModule.forChild(ROUTES);
