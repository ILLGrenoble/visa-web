import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {DocumentationSection, DocumentationService} from '@core';
import {Observable} from 'rxjs';

@Injectable()
export class DocumentationResolver implements Resolve<Observable<DocumentationSection[]>> {

    constructor(private documentationService: DocumentationService) {

    }

    public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DocumentationSection[]> {
        return this.documentationService.getSections();
    }

}
