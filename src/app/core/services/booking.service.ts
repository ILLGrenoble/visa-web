import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'environments/environment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {BookingRequest, BookingToken, BookingUserConfiguration, FlavourAvailabilitiesFuture} from '../models';
import {ObjectMapperService} from './object-mapper.service';
import {Response} from "./visa-response";

export type BookingFlavourRequestInput = {
    flavourId: number;
    quantity: number;
}

export type BookingRequestInput = {
    startDate: string;
    endDate: string;
    name: string;
    comments: string;
    flavourRequests: BookingFlavourRequestInput[];
}

@Injectable()
export class BookingService {
    constructor(private http: HttpClient,
                private objectMapper: ObjectMapperService) {
    }

    public getConfig(): Observable<BookingUserConfiguration> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings/config`;
        return this.http.get<Response<BookingUserConfiguration>>(url)
            .pipe(map((result) => {
                const data = result.data;
                return this.objectMapper.deserialize(data, BookingUserConfiguration);
            }));
    }

    public getBookingRequests(): Observable<BookingRequest[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings`;
        return this.http.get<Response<BookingRequest[]>>(url)
            .pipe(
                map(({data}) => {
                    return data.map(element => this.objectMapper.deserialize(element, BookingRequest))
                })
            );
    }

    public getBookingRequest(uid: string): Observable<BookingRequest> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings/${uid}`;
        return this.http.get<Response<BookingRequest>>(url)
            .pipe(
                map(({data}) => {
                    return this.objectMapper.deserialize(data, BookingRequest);
                })
            );
    }

    public deleteBookingRequest(uid: string): Observable<BookingRequest> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings/${uid}`;
        return this.http.delete<Response<BookingRequest>>(url)
            .pipe(
                map(({data}) => {
                    return this.objectMapper.deserialize(data, BookingRequest);
                })
            );
    }

    public createBookingRequest(input: BookingRequestInput): Observable<{data?: BookingRequest, errors?: string[]}> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings`;
        return this.http.post<Response<BookingRequest>>(url, input)
            .pipe(map((result) => {
                if (result.data) {
                    return {data: this.objectMapper.deserialize(result.data, BookingRequest)}
                }
                return {errors: result.errors}
            }));

    }


    public getBookingRequestTokens(uid: string): Observable<BookingToken[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings/${uid}/tokens`;
        return this.http.get<Response<BookingToken[]>>(url)
            .pipe(
                map(({data}) => {
                    return data.map(element => this.objectMapper.deserialize(element, BookingToken))
                })
            );
    }


    public getFlavourAvailabilities(startDate: string, endDate: string): Observable<FlavourAvailabilitiesFuture[]> {
        const baseUrl = environment.paths.api;
        const url = `${baseUrl}/account/bookings/flavours/availabilities`;
        return this.http.get<Response<FlavourAvailabilitiesFuture[]>>(url, {params: {startDate}})
            .pipe(
                map(({data}) => {
                    return data.map(element => this.objectMapper.deserialize(element, FlavourAvailabilitiesFuture))
                })
            );
    }

}
