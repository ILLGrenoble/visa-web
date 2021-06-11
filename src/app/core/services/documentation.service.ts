import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import fm, {FrontMatterResult} from 'front-matter';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DocumentationSection} from '../models';

@Injectable()
export class DocumentationService {

    constructor(private http: HttpClient) {
    }

    public getSections(): Observable<DocumentationSection[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/docs/sections.json`;
        return this.http.get<any>(url).pipe(
            map((response) => response.sections),
            map((sections) => {
                return sections.map((section) => {
                    return {
                        ...section,
                        icon: this.getIconUrl(section.icon),
                    } as DocumentationSection;
                });
            }));
    }

    public getPage(path: string): Observable<FrontMatterResult<any>> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/docs/pages/${path}.md`;
        return this.http.get<any>(url, {responseType: 'text' as 'json'})
            .pipe(map((response) => fm(response)));
    }

    public getIconUrl(path: string): string {
        const baseUrl = environment.paths.api;
        return `${baseUrl}/docs/${path}`;
    }

}
