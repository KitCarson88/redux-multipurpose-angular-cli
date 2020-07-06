import { NgModule, Optional, SkipSelf } from "@angular/core";{{#if routerKey}}
import { Router } from '@angular/router';{{/if}}

import { initializeStore } from '@redux-multipurpose/core';{{#if routerKey}}
import { configureRouterReducer } from '@redux-multipurpose/angular-router';{{/if}}{{#if enablePersistence}}
import storage from 'redux-persist/lib/storage';{{/if}}

import rootReducer from './store.reducer';{{#if enableEpics}}
import rootEpic from './epics';{{/if}}{{#if enableSagas}}
import rootSaga from './sagas';{{/if}}

const ACTIONS = [
];

const RESOLVERS = [
];

@NgModule({
  imports: [],
  providers: [...ACTIONS, ...RESOLVERS]
})
export class StoreModule
{
  constructor(
    @Optional() @SkipSelf() parentModule: StoreModule{{#if routerKey}},
    private router: Router{{/if}}
  )
  {
    if (parentModule)
      throw new Error("StoreModule is already loaded. Import it in the AppModule only");

    const middlewares = [  ];

    initializeStore({
      reducers: rootReducer({{#if enablePersistence}}storage{{/if}}),
      devTools: true,
      middlewares{{#if enableEpics}},
      epics: rootEpic{{/if}}{{#if enableSagas}},
      sagas: rootSaga{{/if}}{{#if enablePersistence}},
      enablePersistence: true{{/if}}{{#if routerKey}},
      router: configureRouterReducer('{{routerKey}}', this.router){{/if}}{{#if enableLogger}},
      logLevel: 'log'{{/if}}
    });
  }
}