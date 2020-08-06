import { createEntityAdapter } from '@reduxjs/toolkit';

import { createWsInitialState } from '@redux-multipurpose/core';
{{#if substateWsUseAdapter}}

import { {{ pascalCase substateWsName }}DTO } from '../../entities/dto/{{ camelCase substateWsName }}DTO';
{{/if}}

export const INITIAL_STATE_WEB_SERVICES = createWsInitialState([{{#if substateWsNotUseAdapter}}
    '{{ camelCase substateWsName }}'{{/if}}{{#if substateWsUseAdapter}}
    { '{{ camelCase substateWsName }}': { data: {{ camelCase substateWsName }}Adapter.getInitialState() }}{{/if}}
]);