import { Injectable } from '@angular/core';
import { delay, timeout } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class {{ pascalCase substateWsProvider }}Provider
{
    constructor() {}

    {{ camelCase substateWsActions }}()
    {
        //Provide here you call to data retrieve
        
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }
}