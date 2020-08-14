import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { {{ pascalCase substateNoWsName }}State, INITIAL_STATE_{{ constantCase substateNoWsName}} } from './{{ dashCase substateNoWsName}}.model';

const {{ camelCase substateNoWsName}}Slice = createSlice({
    name: '{{ camelCase substateNoWsName}}',
    initialState: INITIAL_STATE_{{ constantCase substateNoWsName}},
    reducers: {
        {{#each actionArray as |actionToAdd|}}
        {{camelCase actionToAdd}}(state: {{> stateType}}, action: PayloadAction) {

        },
        {{/each}}
    }
});

const { actions, reducer } = {{ camelCase substateNoWsName}}Slice;

export const {{ camelCase substateNoWsName}}Reducer = reducer;
export const { {{#each actionArray as |actionToAdd|}}{{camelCase actionToAdd}}, {{/each}} } = actions;