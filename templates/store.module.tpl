import { NgModule, Optional, SkipSelf } from "@angular/core";
import { Router } from '@angular/router';

import { initializeStore } from '@redux-multipurpose/core';
import { configureRouterReducer } from '@redux-multipurpose/angular-router';

import
{
  SpinnerActions,
  SplashActions,
  AppPlatformDeviceActions,
  WsActions,
  StorageActions
} from "./index";

import rootReducer from './store.reducer';
{{#if enableEpics}}import rootEpic from './epics';{{/if}}
{{#if enableSagas}}import rootSaga from './sagas';{{/if}}

import { StorageService } from '../services/storage.service';

import { Converter } from "../utils/converter";

const ACTIONS = [
  SpinnerActions,
  SplashActions,
  AppPlatformDeviceActions,
  WsActions,
  StorageActions
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
    @Optional() @SkipSelf() parentModule: StoreModule,
    private router: Router,
    private storage: StorageService
  )
  {
    if (parentModule)
      throw new Error("StoreModule is already loaded. Import it in the AppModule only");

    //MIDDLEWARES
    const dataNormalizer = () => store => next => action =>
    {
      if (action.payload)
      {
        switch (action.type)
        {
          case 'ws/retrieveExampleData/fulfilled':
          case 'ws/retrieveExampleDataWithAdapter/fulfilled':
            action.payload = Converter.adjustDatesOnExampleDTOArray(action.payload);
            break;
        }
      }

      return next(action);
    };

    const middlewares = [ dataNormalizer() ];

    initializeStore({
      reducers: rootReducer(this.storage),
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