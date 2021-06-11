import {NgModule} from '@angular/core';
import {ROUTING} from './documentation.routing';
import {DocumentationComponent} from './documentation.component';
import {DocumentationPageComponent} from './documentation-page.component';
import {DocumentationResolver} from './documentation.resolver';
import {DocumentationPageResolver} from './documentation-page.resolver';
import {SharedModule} from '@shared';

@NgModule({
    imports: [
        SharedModule,
        ROUTING
    ],
    providers: [
        DocumentationResolver,
        DocumentationPageResolver
    ],
    declarations: [
        DocumentationComponent,
        DocumentationPageComponent
    ]
})
export class DocumentationModule {


}
