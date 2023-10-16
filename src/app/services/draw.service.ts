import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root"
})

export class DrawService {

    constructor(private http: HttpClient) {}

    get_results() {

        let api_endpoint = ''
        let data = JSON.stringify({})
        
        return this.http.post<ServerResponse>(api_endpoint,data).pipe()

    }

}

export interface ServerResponse {
    status: number;
    payload: any;
}