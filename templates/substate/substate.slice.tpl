import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { {{ pascalCase substateName }}State, INITIAL_STATE_{{ constantCase substateName}} } from './{{ camelCase substateName}}.model';

const {{ camelCase substateName}}Slice = createSlice({
    name: '{{ camelCase substateName}}',
    initialState: INITIAL_STATE_{{ constantCase substateName}},
    reducers: {
        {{#each actionArray as |actionToAdd|}}
            {{camelCase actionToAdd}}(state: {{ pascalCase substateName }}State, action: PayloadAction) {

            }
        {{/each}}

        hide(state: SplashState, action: PayloadAction<string>) {
            return state;
        },
    }
});

const { actions, reducer } = {{ camelCase substateName}}Slice;

export const {{ camelCase substateName}}Reducer = reducer;
export const {  } = actions;