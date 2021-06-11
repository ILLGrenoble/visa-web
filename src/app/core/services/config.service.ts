import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Configuration} from '../models';

export function configServiceInitializerFactory(configurationService: ConfigService): () => Promise<Configuration> {
    // a lambda is required here, otherwise `this` won't work inside ConfigurationService::load
    return () => configurationService.load();
}

@Injectable()
export class ConfigService {

    constructor(private http: HttpClient) {
    }

    // the return value (Promise) of this method is used as an APP_INITIALIZER,
    // so the application's initialization will not complete until the Promise resolves.
    public load(): Promise<Configuration> {
        return new Promise<Configuration>((resolve, reject) => {
            const configurationUrl = `${environment.paths.api}/configuration`;
            this.http.get<any>(configurationUrl)
                .toPromise()
                .then((response) => {
                    const configuration = response.data as Configuration;
                    resolve(configuration);
                })
                .catch((error) => {
                    console.error(`error loading configuration: ${JSON.stringify(error)}`);
                    reject(error);
                });
        });
    }

}
