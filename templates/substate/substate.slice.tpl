import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { SpinnerState, INITIAL_STATE_SPINNER } from './spinner.model';

const spinnerSlice = createSlice({
    name: 'spinner',
    initialState: INITIAL_STATE_SPINNER,
    reducers: {
        show(state: SpinnerState, action: PayloadAction<any>) {
            return true;
        },
        hide(state: SpinnerState, action: PayloadAction<any>) {
            return false;
        }
    }
});

const { actions, reducer } = spinnerSlice;

export const spinnerReducer = reducer;
export const { show, hide } = actions;