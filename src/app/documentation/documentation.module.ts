import {NgModule} from '@angular/core';
import {ROUTING} from './documentation.routing';
import {DocumentationComponent} from './documentation.component';
import {DocumentationPageComponent} from './documentation-page.component';
import {SharedModule} from '@shared';

@NgModule({
    imports: [
        SharedModule,
        ROUTING
    ],
    declarations: [
        DocumentationComponent,
        DocumentationPageComponent
    ]
})
export class DocumentationModule {


}
