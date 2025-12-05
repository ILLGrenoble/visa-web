import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {
    BookingFlavourConfiguration,
} from '../models';
import {ObjectMapperService} from './object-mapper.service';
import {Response} from "./visa-response";

@Injectable()
export class BookingService {
    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService) {
    }

    public getConfig(): Observable<BookingFlavourConfiguration[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings/config`;
        return this.http.get<Response<BookingFlavourConfiguration[]>>(url)
            .pipe(map((result) => {
                const data = result.data;
                return data.map(element => this.objectMapper.deserialize(element, BookingFlavourConfiguration))
            }));
    }

}
