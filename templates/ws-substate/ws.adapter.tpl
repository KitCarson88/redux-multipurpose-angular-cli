
export const {{ camelCase substateWsName }}Adapter = createEntityAdapter<{{ pascalCase substateWsName }}DTO>({
    // Assume IDs are stored in a field other than `element.id` where element is one object of {{ pascalCase substateWsName }}
    selectId: element => element.id,
    // Keep the "all IDs" array sorted based on {{ camelCase substateWsName }} ids
    sortComparer: (a, b) => a.id < b.id ? -1 : 1
});

$1