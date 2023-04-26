import {RouterModule, Routes} from '@angular/router';
import {AuthenticatedContainerComponent} from '@shared';
import {DocumentationPageComponent} from './documentation-page.component';
import {DocumentationComponent} from './documentation.component';
import {documentationResolver} from "./documentation.resolver";
import {documentationPageResolver} from "./documentation-page.resolver";

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: '',
                component: DocumentationComponent,
                resolve: {sections: documentationResolver},
            },
            {
                path: ':section/:page',
                component: DocumentationPageComponent,
                runGuardsAndResolvers: 'always',
                resolve: {page: documentationPageResolver},
            },
        ],
    },
];

export const ROUTING = RouterModule.forChild(ROUTES);
