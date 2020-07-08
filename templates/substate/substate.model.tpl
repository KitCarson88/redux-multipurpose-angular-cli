{{#if substateObject}}
export interface {{ pascalCase substateName }}State
{

}

export const INITIAL_STATE_{{ constantCase substateName}}: {{ pascalCase substateName }}State = {

};
{{/if}}
{{#if substateNotObject}}
export type {{ pascalCase substateName }}State = {{substateType}};

export const INITIAL_STATE_{{ constantCase substateName}}: {{ pascalCase substateName }}State = {{substateInitalValue}};
{{/if}}