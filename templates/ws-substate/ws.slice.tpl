import { Injector } from '@angular/core';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { prepareThunk, prepareThunkActionReducers } from '@redux-multipurpose/core';

import { 
    INITIAL_STATE_WEB_SERVICES
} from './ws.model';


//Manually inject providers: PLEASE DON'T DELETE THIS PLACEHOLDER
const wsProvidersInjector = Injector.create({ providers: [
    //Ws providers: PLEASE DON'T DELETE THIS PLACEHOLDER
]});