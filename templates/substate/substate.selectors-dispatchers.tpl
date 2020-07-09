import { Injectable } from '@angular/core';

import { dispatch } from '@redux-multipurpose/core';

import {
    {{#each actionArray as |actionToAdd|}}{{camelCase actionToAdd}} as {{camelCase actionToAdd}}Action,
    {{/each}}
} from './{{ camelCase substateName}}.slice';

@Injectable()
export class {{ pascalCase substateName}}Actions
{
    {{#each actionArray as |actionToAdd|}}@dispatch()
    {{camelCase actionToAdd}} = () => {
        return {{camelCase actionToAdd}}Action();
    };
    {{/each}}
}