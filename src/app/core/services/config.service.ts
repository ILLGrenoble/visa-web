import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Configuration} from '../models';
import {Observable, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";

export function configServiceInitializerFactory(configurationService: ConfigService): () => Observable<Configuration> {
    // a lambda is required here, otherwise `this` won't work inside ConfigurationService::load
    return () => configurationService.load();
}

@Injectable()
export class ConfigService {

    constructor(private http: HttpClient) {
    }

    // the return value (Promise) of this method is used as an APP_INITIALIZER,
    // so the application's initialization will not complete until the Promise resolves.
    public load(): Observable<Configuration> {
        const configurationUrl = `${environment.paths.api}/configuration`;

        return this.http.get<any>(configurationUrl)
            .pipe(
                map(({data}) => {
                    return data;
                }),
                catchError(error => {
                    console.error(`error loading configuration: ${JSON.stringify(error)}`);
                    return throwError(error);
                })
            );
    }
}
