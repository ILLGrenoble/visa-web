import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {map} from 'rxjs/operators';
import {Observable} from "rxjs";
import {Response} from "./visa-response";

@Injectable()
export class HelperService {

    constructor(private http: HttpClient) {
    }

    public getRandomInstanceName(): Observable<string> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/helpers/random_instance_name`;
        return this.http.get<Response<string>>(url).pipe(map((response) => {
            return response.data;
        }));
    }

}
