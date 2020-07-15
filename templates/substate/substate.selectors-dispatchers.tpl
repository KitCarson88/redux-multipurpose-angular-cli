import { Injectable } from '@angular/core';

import { dispatch } from '@redux-multipurpose/core';

import {
    {{#each actionArray as |actionToAdd|}}
    {{camelCase actionToAdd}} as {{camelCase actionToAdd}}Action,
    {{/each}}
} from './{{ camelCase substateNoWsName}}.slice';

@Injectable()
export class {{ pascalCase substateNoWsName}}Actions
{
    {{#each actionArray as |actionToAdd|}}
    @dispatch()
    {{camelCase actionToAdd}} = () => {
        return {{camelCase actionToAdd}}Action();
    };
    
    {{/each}}
}