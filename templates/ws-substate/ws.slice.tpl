import { Injector } from '@angular/core';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { prepareThunk, prepareThunkActionReducers } from '@redux-multipurpose/core';

import { 
    INITIAL_STATE_WEB_SERVICES
} from './ws.model';

import {
    {{ pascalCase substateWsProvider }}Provider
} from '../../providers';

//Manually inject providers
const wsProvidersInjector = Injector.create({ providers: [
    { provide: {{ pascalCase substateWsProvider }}Provider }
]});
const {{camelCase substateWsProvider}}Provider = wsProvidersInjector.get({{pascalCase substateWsProvider}}Provider);

//Thunks
export const {{ camelCase substateWsAction }}Thunk = prepareThunk('ws', '{{ camelCase substateWsAction }}', {{camelCase substateWsProvider}}Provider.{{ camelCase substateWsAction }});

//Ws actions and reducers
const wsSlice = createSlice({
    name: 'ws',
    initialState: INITIAL_STATE_WEB_SERVICES,
    reducers: {
        resetWsData(state, action: PayloadAction<any>) {
            state = INITIAL_STATE_WEB_SERVICES;
        }
    },
    extraReducers: prepareThunkActionReducers([
        //Ws prepare thunks: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER
    ])
});

export const wsReducer = wsSlice.reducer;
export const resetWsData = wsSlice.actions.resetWsData;