import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Configuration} from '../models';
import {Observable, of, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {Response} from "./visa-response";

export function configServiceInitializerFactory(configurationService: ConfigService): () => Observable<Configuration> {
    return () => configurationService.configuration$();
}

@Injectable()
export class ConfigService {
    private _configuration: Configuration;

    constructor(private http: HttpClient) {
    }

    configuration$(): Observable<Configuration> {
        if (this._configuration != null) {
            return of(this._configuration);
        } else {
            return this._load();
        }
    }

    reload(): Observable<Configuration> {
        this._configuration = null;
        return this.configuration$();
    }


    private _load(): Observable<Configuration> {
        const configurationUrl = `${environment.paths.api}/configuration`;

        return this.http.get<Response<Configuration>>(configurationUrl)
            .pipe(
                map(({data}) => {
                    this._configuration = data;
                    return data;
                }),
                catchError(error => {
                    console.error(`error loading configuration: ${JSON.stringify(error)}`);
                    return throwError(error);
                }),
            );
    }
}
