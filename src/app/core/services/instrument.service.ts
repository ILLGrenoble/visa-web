import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Instrument} from '../models';
import {ObjectMapperService} from './object-mapper.service';
import {Response} from "./visa-response";

@Injectable()
export class InstrumentService {
    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService) {
    }

    public getInstruments(): Observable<Instrument[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/instruments`;
        return this.http.get<Response<Instrument[]>>(url).pipe(map((response) => {
            const instruments = response.data;
            return instruments.map((instrument) => this.objectMapper.deserialize(instrument, Instrument));
        }));
    }

}
