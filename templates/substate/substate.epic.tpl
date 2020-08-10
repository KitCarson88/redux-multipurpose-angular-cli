
export const {{ camelCase epicName }}: Epic<any, any, any> = 
    (action$, _) => action$.pipe(ofType({{ camelCase epicOnTriggerAction }}));