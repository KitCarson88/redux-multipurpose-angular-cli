import { Injector } from '@angular/core';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { prepareThunk, prepareThunkActionReducers } from '@redux-multipurpose/core';

import { 
    INITIAL_STATE_WEB_SERVICES
} from './ws.model';

//Ws providers imports: PLEASE DON'T DELETE THIS PLACEHOLDER

//Manually inject providers
const wsProvidersInjector = Injector.create({ providers: [
    //Ws providers: PLEASE DON'T DELETE THIS PLACEHOLDER
]});

//Thunks
//Ws thunks: PLEASE DON'T DELETE THIS PLACEHOLDER

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
        //Ws prepare thunks: PLEASE DON'T DELETE THIS PLACEHOLDER
    ])
});

export const wsReducer = wsSlice.reducer;
export const resetWsData = wsSlice.actions.resetWsData;