
export function {{ camelCase epicName }}(): Epic<any, any, any>
{
    return (action$, _) => action$.pipe(ofType({{ camelCase epicOnTriggerAction }}));
}