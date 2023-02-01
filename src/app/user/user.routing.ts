import {RouterModule, Routes} from '@angular/router';
import {
    AccountExperimentCountResolver,
    AccountInstanceCountResolver,
    AccountInstanceExperimentsResolver,
    AccountQuotaResolver,
    AuthenticationGuard
} from '@core';
import {AuthenticatedContainerComponent, LoginComponent} from '@shared';
import {HomeComponent} from './home/home.component';

import {InstanceNewComponent} from './instance-new';
import {InstanceComponent} from './instance/instance.component';
import {JupyterComponent} from './jupyter/jupyter.component';

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
                canActivate: [AuthenticationGuard]
            },
            {
                path: 'instances/new',
                canActivate: [AuthenticationGuard],
                component: InstanceNewComponent,
                resolve: {quotas: AccountQuotaResolver, totalExperiments: AccountExperimentCountResolver},
            },
            {
                path: 'instances/:id',
                component: InstanceComponent,
                canActivate: [AuthenticationGuard],
            },
            {
                path: 'instances/:id/beta',
                component: InstanceComponent,
                canActivate: [AuthenticationGuard],
                data: {useWebX: true}
            },
            {
                path: 'instances/:id/jupyter',
                component: JupyterComponent,
                canActivate: [AuthenticationGuard],
            },
        ],
    },
];

export const ROUTING = RouterModule.forChild(ROUTES);
