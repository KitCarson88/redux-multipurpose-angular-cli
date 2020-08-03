{{#if enablePersistence}}import { createStoredReducer, createSecureStoredReducer } from '@redux-multipurpose/core';

{{/if}}

export function rootReducer({{#if enablePersistence}}storage{{/if}})
{
  //Persisted reducers: PLEASE DON'T DELETE THIS PLACEHOLDER

  return {
    //Reducers: PLEASE DON'T DELETE THIS PLACEHOLDER
  };
}

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;