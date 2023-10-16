import { Injectable } from "@angular/core";
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: "root"
})

export class DbService {

    private _storage: Storage

    constructor(private storage: Storage) {
    } 

    async initialize() {
        // initialize storage
        const storage = await this.storage.create();
        this._storage = storage;
        console.log("local storage service initialized")
    }

    is_ready() { 
        if(this._storage == null) {
            return false
        } else {
            return true
        }
    }

    set(key: string, value: any) {
        return this._storage?.set(key,value)
    }

    get(key: string) {
        return this._storage?.get(key)
    }

    remove(key: string) {
        return this._storage?.remove(key)
    }

    keys() {
        return this._storage?.keys()
    }

}