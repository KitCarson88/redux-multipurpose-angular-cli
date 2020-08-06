
export const {{ camelCase substateWsName }} = state => state.ws.{{ camelCase substateWsName }}.data;
const {{ camelCase substateWsName }}Selectors = {{ camelCase substateWsName }}Adapter.getSelectors();

export const {{ camelCase substateWsName }}Object =
    createSelector(
        [{{ camelCase substateWsName }}],
        (items) => items? {{ camelCase substateWsName }}Selectors.selectEntities(items) : null
    );
export const {{ camelCase substateWsName }}Array = 
    createSelector(
        [{{ camelCase substateWsName }}],
        (items) => items? {{ camelCase substateWsName }}Selectors.selectAll(items) : null
    );
export const {{ camelCase substateWsName }}Count = 
    createSelector(
        [{{ camelCase substateWsName }}],
        (items) => items? {{ camelCase substateWsName }}Selectors.selectTotal(items) : null
    );

$1