import {inject} from '@angular/core';

import {ActivatedRouteSnapshot, ResolveFn, Router} from '@angular/router';
import {DocumentationService} from '@core';
import {FrontMatterResult} from 'front-matter';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {NotifierService} from 'angular-notifier';

export const documentationPageResolver: ResolveFn<any | Observable<FrontMatterResult<any>>> = (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const documentationService =inject(DocumentationService);
    const notifierService =inject(NotifierService);

    const section = route.params.section;
    const page = route.params.page;

    return documentationService.getPage(`${section}/${page}`)
        .pipe(catchError(() => {
            router.navigate(['/']).then(() => {
                notifierService.notify('error', 'Documentation page not found');
            });
            return throwError(() => new Error('Error fetching page'));
        }));
}
