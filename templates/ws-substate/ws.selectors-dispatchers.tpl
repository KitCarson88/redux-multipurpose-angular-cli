import { Injectable } from '@angular/core';

import { dispatch } from '@redux-multipurpose/core';
import { createSelector } from '@reduxjs/toolkit';

import {
    {{ camelCase substateWsAction }}Thunk
} from './ws.slice';
{{#if substateWsUseAdapter}}

import {
    {{ camelCase substateWsName }}Adapter
} from './ws.model';
{{/if}}

@Injectable()
export class WsActions
{
    @dispatch()
    {{ camelCase substateWsAction }} = () => {
        return {{ camelCase substateWsAction }}Thunk();
    };
    
}