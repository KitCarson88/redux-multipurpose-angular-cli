import { Injectable } from '@angular/core';

import { dispatch } from '@redux-multipurpose/core';
import { createSelector } from '@reduxjs/toolkit';

import {
    {{ camelCase substateWsAction }}Thunk
} from './ws.slice';
//Adapters imports: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER
//Selectors: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER

@Injectable()
export class WsActions
{
    @dispatch()
    {{ camelCase substateWsAction }} = () => {
        return {{ camelCase substateWsAction }}Thunk();
    };
    
}