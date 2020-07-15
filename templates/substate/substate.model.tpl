{{#if substateObject}}
export interface {{ pascalCase substateNoWsName }}State
{

}

export const INITIAL_STATE_{{ constantCase substateNoWsName}}: {{ pascalCase substateNoWsName }}State = {

};
{{/if}}
{{#if substateNotObject}}
export type {{ pascalCase substateNoWsName }}State = {{substateType}};

export const INITIAL_STATE_{{ constantCase substateNoWsName}}: {{ pascalCase substateNoWsName }}State = {{substateInitalValue}};
{{/if}}