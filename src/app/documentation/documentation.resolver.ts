import {inject} from '@angular/core';
import {ResolveFn} from '@angular/router';
import {DocumentationSection, DocumentationService} from '@core';
import {Observable} from 'rxjs';

export const documentationResolver: ResolveFn<Observable<DocumentationSection[]>> = () => {
    const documentationService = inject(DocumentationService);
    return documentationService.getSections();
}
