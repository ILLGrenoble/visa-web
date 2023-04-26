import {RouterModule, Routes} from '@angular/router';
import {AuthenticatedContainerComponent, LoginComponent} from '@shared';
import {HomeComponent} from './home/home.component';

import {InstanceNewComponent} from './instance-new';
import {InstanceComponent} from './instance/instance.component';
import {JupyterComponent} from './jupyter/jupyter.component';
import {accountExperimentCountResolver, accountQuotaResolver, authenticationGuard} from "../core";

export const ROUTES: Routes = [
    {
        path: '',
        component: AuthenticatedContainerComponent,
        children: [
            {
                path: 'login', component: LoginComponent,
            },
            {
                path: '', redirectTo: 'home', pathMatch: 'full'
            },
            {
                path: 'home', component: HomeComponent,
                canActivate: [authenticationGuard]
            },
            {
                path: 'instances/new',
                canActivate: [authenticationGuard],
                component: InstanceNewComponent,
                resolve: {quotas: accountQuotaResolver, totalExperiments: accountExperimentCountResolver},
            },
            {
                path: 'instances/:id',
                component: InstanceComponent,
                canActivate: [authenticationGuard],
            },
            {
                path: 'instances/:id/beta',
                component: InstanceComponent,
                canActivate: [authenticationGuard],
                data: {useWebX: true}
            },
            {
                path: 'instances/:id/jupyter',
                component: JupyterComponent,
                canActivate: [authenticationGuard],
            },
        ],
    },
];

export const ROUTING = RouterModule.forChild(ROUTES);
