{{#if enablePersistence}}import { createStoredReducer, createSecureStoredReducer } from '@redux-multipurpose/core';

{{/if}}

export function rootReducer({{#if enablePersistence}}storage{{/if}})
{
  //Persisted reducers: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER

  return {
    //Reducers: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER
  };
}

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;