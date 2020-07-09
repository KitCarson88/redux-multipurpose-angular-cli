{{#if enablePersistence}}import { createStoredReducer } from '@redux-multipurpose/core';

{{/if}}export function rootReducer({{#if enablePersistence}}storage{{/if}})
{
  return {
    //Reducers: PLEASE DON'T DELETE THIS PLACEHOLDER
  };
}

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;