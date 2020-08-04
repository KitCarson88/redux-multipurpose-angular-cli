const glob = require('glob-promise');
const fs = require('fs');
const { cwd } = require('process');
const { camelCase, pascalCase, kebabCase } = require('change-case');

const SRC_DIR = 'src';

function getSrcFileRelativePath(file)
{
    var dirs = glob.sync(SRC_DIR + '/**/*');

    for (var i = 0; i < dirs.length; ++i)
        if (dirs[i].indexOf(file) >= 0)
            return dirs[i];

    return null;
}

function getSrcFileAbsolutePath(file)
{
    let relative = getSrcFileRelativePath(file);
    if (relative)
        return cwd() + '/' + relative;
    else
        return null;
}

function getStoreDirectory(absolute)
{
    var filePath;
    if (absolute)
        filePath = getSrcFileAbsolutePath('store.module');
    else
        filePath = getSrcFileRelativePath('store.module');
    const store = 'store/';
    return filePath.substring(0, filePath.indexOf(store)) + store;
}

//If store module doesn't exists return false
//If store module exists in the right folder returns true
//If store module exists in a wrong folder exits the app
function verifyStoreModule()
{
    var dirs = glob.sync(SRC_DIR + '/**/*');

    for (var i = 0; i < dirs.length; ++i)
    {
        var filePath = getSrcFileRelativePath('store.module');
        if (filePath)
        {
            if (filePath.indexOf("store/store.module") < 0)
            {
                console.log("The store module is not well configured. Please delete it and restart the cli");
                process.exit(-1);
            }

            return true;
        }

        return false;
    }
}

//Verify if StoreModule is added to app.module yet.
//If no app.module is recognized, it quits the app.
function verifyInAppModuleImport(pathFile)
{
    if (pathFile)
    {
        var appModule = fs.readFileSync(pathFile).toString();
        return appModule.indexOf("StoreModule") >= 0;
    }
    else
    {
        console.log("Cannot recognize app.module. Exit...");
        process.exit(-1);
        return false;
    }
}

function trimLines(array)
{
    for (var i = 0; i < array.length; ++i)
        array[i] = array[i].trim();

    return array;
}

function appModuleImportsOnNewLines(file)
{
    var fileContent = fs.readFileSync(file).toString();
    //console.log(fileContent);
    const fileLines = fileContent.split(/\r?\n/);
    //console.log(fileLines);

    for (var i = 0; i < fileLines.length; ++i)
    {
        if (fileLines[i].indexOf('imports') >= 0)
        {
            //console.log("Line index: ", i);
            //console.log("Line: ", fileLines[i]);

            var line = fileLines[i];

            var openSquareBracketCount = 0, closeSquareBracketCount = 0;

            for (var j = 0; j < line.length; ++j)
            {
                const char = line.charAt(j);
                if (char == '[')
                    ++openSquareBracketCount;
                else if (char == ']')
                    ++closeSquareBracketCount;
            }

            //console.log("openBrackets: ", openSquareBracketCount);
            //console.log("closeBrackets: ", closeSquareBracketCount);

            if (openSquareBracketCount >= 0 && openSquareBracketCount == closeSquareBracketCount)
            {
                line = trimLines(line.split('[')).join('[\n\t\t');
                line = trimLines(line.split(']')).join('\n\t]');
                line = trimLines(line.split(',')).join(',\n\t\t').trim();

                //console.log("line: ", line);

                fileLines[i] = line;
            }
        }
    }

    fs.writeFileSync(file, fileLines.join('\n'));
}

function verifyIfStringInFileExists(value, pathFile)
{
    var file = fs.readFileSync(pathFile).toString();
    return file.indexOf(value) >= 0;
}

function verifyIfWholeWordInFileExists(value, pathFile)
{
    var file = fs.readFileSync(pathFile).toString();
    const ret = file.match(new RegExp(/\b/.source + new RegExp(value).source + /\b/.source, 'gi'));
    return ret;
}

module.exports = function (plop)
{
    //Verify if store module exists and it's contained under src/store path
    plop.addHelper('cwd', (p) => process.cwd());

    if (!verifyStoreModule())
    {
        console.log('\nNo store.module found. Let\'s initialize a new one\n');

        plop.setGenerator('createStore', {
            prompts: [{
                type: 'input',
                name: 'storeDir',
                message: 'In which directory do you want to create the store folder?',
                default: SRC_DIR
            }, {
                type: 'checkbox',
                name: 'configurations',
                message: 'Choose which features activate on store configuration\n',
                choices: [
                    { value: 'epics', name: 'Epics skeleton (redux-observables)' },
                    { value: 'sagas', name: 'Sagas skeleton (redux-saga)' },
                    { value: 'persistence', name: 'Persistence (redux-persist)' },
                    { value: 'logger', name: 'Logger (redux-logger)' }
                ]
            }, {
                type: 'input',
                name: 'routerKey',
                message: 'Do you want to enable angular router reducer? Leave it blank if you don\'t need it; otherwise digit a key name to the reducer (e.g. router)'
            }],
            actions: function(data) {
                var actions = [];

                if (data.configurations.indexOf('epics') >= 0)
                    data.enableEpics = true;
                if (data.configurations.indexOf('sagas') >= 0)
                    data.enableSagas = true;
                if (data.configurations.indexOf('persistence') >= 0)
                    data.enablePersistence = true;
                if (data.configurations.indexOf('logger') >= 0)
                    data.enableLogger = true;
    
                actions.push({
                    type: 'add',
                    path: '{{cwd}}/' + data.storeDir + '/store/store.module.ts',
                    templateFile: 'templates/store.module.tpl'
                });
                actions.push({
                    type: 'add',
                    path: '{{cwd}}/' + data.storeDir + '/store/store.reducer.ts',
                    templateFile: 'templates/store.reducer.tpl'
                });
                actions.push({
                    type: 'add',
                    path: '{{cwd}}/' + data.storeDir + '/store/index.ts',
                    templateFile: 'templates/index.tpl',
                    skipIfExists: true
                });

                if (data.enableEpics)
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/' + data.storeDir + '/store/epics.ts',
                        templateFile: 'templates/epics.tpl',
                        skipIfExists: true
                    });

                if (data.enableSagas)
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/' + data.storeDir + '/store/sagas.ts',
                        templateFile: 'templates/sagas.tpl',
                        skipIfExists: true
                    });

                let appModuleFile = getSrcFileAbsolutePath('app.module');
                if (!verifyInAppModuleImport(appModuleFile))
                {
                    appModuleImportsOnNewLines(appModuleFile);

                    actions.push({
                        type: 'modify',
                        path: appModuleFile,
                        pattern: /((imports)\s*\t*\n*:\s*\t*\n*\[)/gi,
                        template: '$1\n\t\tStoreModule,'
                    });
                    actions.push({
                        type: 'modify',
                        path: appModuleFile,
                        pattern: /(\n*@NgModule\s*\t*\n*\(\s*\t*\n*\{)/gi,
                        template: '\n\nimport { StoreModule } from \'' + data.storeDir + '/store/store.module\';$1'
                    });
                }
    
                return actions;
            }
        });
    }
    else
    {
        plop.setGenerator('create', {
            prompts: [{
                type: 'list',
                name: 'operation',
                message: 'Select an operation',
                choices: [
                    { value: 'substate', name: 'Create substate' },
                    { value: 'persist', name: 'Persist a substate' },
                    { value: 'epic', name: 'Create epic' },
                    //{ value: 'saga', name: 'Create saga' }
                ]
            }, {
                when: function(response) {
                    return response.operation === 'substate';
                },
                type: 'list',
                name: 'substateFunction',
                message: 'What type of substate?',
                choices: [
                    { value: 'ws', name: 'Web service wrapper substate' },
                    { value: 'generic', name: 'Generic substate' }
                ]
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'generic';
                },
                type: 'input',
                name: 'substateNoWsName',
                message: 'Name?'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'ws';
                },
                type: 'input',
                name: 'substateWsName',
                message: 'Data name?'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'generic';
                },
                type: 'list',
                name: 'substateType',
                message: 'Type?',
                choices: [
                    'boolean',
                    'number',
                    'string',
                    'object'
                ]
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'generic';
                },
                type: 'input',
                name: 'substateNoWsActions',
                message: 'Do you want to add some actions?\n(Please insert them separated by comma; or leave it blank to skip this step)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'ws';
                },
                type: 'confirm',
                name: 'substateWsUseAdapter',
                message: 'Do you want to use an adapter for your data? (Useful when you want data indexing and auto data ordering on retrieve)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'ws';
                },
                type: 'input',
                name: 'substateWsAction',
                message: 'What is the name of data retrieve action?'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'ws';
                },
                type: 'input',
                name: 'substateWsProvider',
                message: 'Insert a provider name. Please provide the same name if you want to add another call to the same provider.'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'generic';
                },
                type: 'confirm',
                name: 'substateNoWsStatic',
                message: 'Do you want to add the reducer statically?\n(alternatively you can add it dynamically everywhere in your code)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateFunction === 'generic' && !response.substateNoWsStatic;
                },
                type: 'input',
                name: 'substateNoWsStaticMountOnComponent',
                message: 'Do you want to mount the reducer automatically at the init of a component or a page?\n(type the name of the ts file that contains the page or component, otherwise leave it blank)'
            }, {
                when: function(response) {
                    return response.operation === 'persist';
                },
                type: 'input',
                name: 'persistSubstate',
                message: 'What existent substate do you want to persist?'
            }, {
                when: function(response) {
                    return response.operation === 'persist';
                },
                type: 'confirm',
                name: 'persistSecure',
                message: 'Do you want to persist it securely?'
            }, {
                when: function(response) {
                    return response.operation === 'epic';
                },
                type: 'input',
                name: 'epicSubstate',
                message: 'Which state do you want to add the epic to?'
            }, {
                when: function(response) {
                    return response.operation === 'epic';
                },
                type: 'input',
                name: 'epicName',
                message: 'What is the name of the epic method?'
            }, {
                when: function(response) {
                    return response.operation === 'epic';
                },
                type: 'input',
                name: 'epicOnTriggerAction',
                message: 'What is the launch existent action to trigger?'
            }/*, {
                when: function(response) {
                    return response.operation === 'epic';
                },
                type: 'input',
                name: 'epicStatic',
                message: 'Do you want to add the epic statically?\n(alternatively you can add it dynamically everywhere in your code)'
            }*/],
            actions: function(data) {
                var actions = [];
                var storeDirectory = getStoreDirectory(true);

                if (data.operation === 'substate')
                {
                    //Generic substate creation logics
                    if (data.substateFunction === 'generic')
                    {
                        if (data.substateNoWsName && data.substateType)
                        {
                            if (data.substateType === 'object')
                                data.substateObject = true;
                            else
                            {
                                data.substateNotObject = true;
                                if (data.substateType === 'boolean')
                                    data.substateInitalValue = 'false';
                                else if (data.substateType === 'number')
                                    data.substateInitalValue = '0';
                                else if (data.substateType === 'string')
                                    data.substateInitalValue = 'null';
                            }

                            //Create generic substate model
                            actions.push({
                                type: 'add',
                                path: storeDirectory + '{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.model.ts',
                                templateFile: 'templates/substate/substate.model.tpl'
                            });
                            //Create generic substate slice
                            actions.push({
                                type: 'add',
                                path: storeDirectory + '{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.slice.ts',
                                templateFile: 'templates/substate/substate.slice.tpl'
                            });

                            //Actions creation logics
                            if (data.substateNoWsActions && data.substateNoWsActions.length)
                            {
                                var actionArray = data.substateNoWsActions.split(',');
                                for (var i = 0; i < actionArray.length; ++i)
                                {
                                    actionArray[i] = actionArray[i].trim();

                                    if (actionArray[i] === '')
                                        actionArray.splice(i, 1);
                                }
                                data.actionArray = actionArray;

                                plop.setPartial('stateType', pascalCase(data.substateNoWsName) + 'State');

                                //Create generic substate selectors and dispatchers file
                                actions.push({
                                    type: 'add',
                                    path: storeDirectory + '{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.selectors-dispatchers.ts',
                                    templateFile: 'templates/substate/substate.selectors-dispatchers.tpl'
                                });

                                if (verifyIfStringInFileExists("export {};", getSrcFileAbsolutePath("store/index.ts")))
                                {
                                    //Remove default export {}; from index
                                    actions.push({
                                        type: 'modify',
                                        pattern: /(export\s*\{\s*\};)/gi,
                                        path: storeDirectory + 'index.ts',
                                        template: ''
                                    });
                                }

                                //Append actions class to store index
                                actions.push({
                                    type: 'append',
                                    path: storeDirectory + 'index.ts',
                                    template: 'export { {{ pascalCase substateNoWsName}}Actions } from \'./{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.selectors-dispatchers\';'
                                });

                                //Add actions class import to store module
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.module.ts',
                                    pattern: /(\/\/Actions imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: '{{ pascalCase substateNoWsName}}Actions,\n\t$1'
                                });

                                //Add actions class to store module provide
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.module.ts',
                                    pattern: /(\/\/Actions: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: '{{ pascalCase substateNoWsName}}Actions,\n\t$1'
                                });
                            }

                            //Static generic substate reducer add logics
                            if (data.substateNoWsStatic)
                            {
                                //Append generic substate reducer import to store
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.reducer.ts',
                                    pattern: /(\nexport function rootReducer)/gi,
                                    template: 'import { {{ camelCase substateNoWsName }}Reducer } from \'./{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.slice\';\n$1'
                                });

                                //Append generic substate reducer
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.reducer.ts',
                                    pattern: /(\s*\t*\/\/Reducers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: '\n\t\t{{ camelCase substateNoWsName }}: {{ camelCase substateNoWsName }}Reducer,$1'
                                });
                            }
                            else if (data.substateNoWsStaticMountOnComponent && data.substateNoWsStaticMountOnComponent.length)
                            {
                                if (!data.substateNoWsStaticMountOnComponent.endsWith('.ts'))
                                    data.substateNoWsStaticMountOnComponent += '.ts';
                                var path = getSrcFileRelativePath(data.substateNoWsStaticMountOnComponent);

                                if (path)
                                {
                                    if (verifyIfStringInFileExists("@Component", getSrcFileAbsolutePath(data.substateNoWsStaticMountOnComponent)))
                                    {
                                        if (!verifyIfStringInFileExists("@ReducerInjector", getSrcFileAbsolutePath(data.substateNoWsStaticMountOnComponent)))
                                        {
                                            //Append ReducerInjector decorator import
                                            actions.push({
                                                type: 'modify',
                                                path,
                                                pattern: /('@angular\/core';*)/gi,
                                                template: '$1\n\nimport { ReducerInjector } from \'@redux-multipurpose/core\';\n'
                                            });

                                            //Append ReducerInjector decorator
                                            actions.push({
                                                type: 'modify',
                                                path,
                                                pattern: /(@Component((.|\n)*)\}\))/gi,
                                                template: '$1\n@ReducerInjector([])'
                                            });
                                        }

                                        //Append dynamic reducer import
                                        actions.push({
                                            type: 'modify',
                                            path,
                                            pattern: /(import { ReducerInjector((.)*\n))/gi,
                                            template: '$1import { {{ camelCase substateNoWsName}}Reducer } from \'' + getStoreDirectory(false) + '{{ camelCase substateNoWsName}}/{{ camelCase substateNoWsName}}.slice\';\n'
                                        });

                                        //Append dynamic reducer into decorator
                                        actions.push({
                                            type: 'modify',
                                            path,
                                            pattern: /(@ReducerInjector\(\[({(.|\n)*},\s)*)/gi,
                                            templateFile: 'templates/ws-substate/ws.component-injection.tpl'
                                        });
                                    }
                                    else
                                        console.log("File " + path + " not recognized as a component");
                                }
                            }
                        }
                    }
                    else if (data.substateFunction === 'ws')    //Ws substate creation logics
                    {
                        //Set a flag before ws substate creation to detect first initialization
                        var wsCreation = false;
                        if (!getSrcFileRelativePath('ws.selectors-dispatchers.ts'))
                            wsCreation = true;

                        //Add ws model file
                        actions.push({
                            type: 'add',
                            path: storeDirectory + 'ws/ws.model.ts',
                            templateFile: 'templates/ws-substate/ws.model.tpl',
                            abortOnFail: false
                        });

                        //Add ws selectors and dispatchers file
                        actions.push({
                            type: 'add',
                            path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                            templateFile: 'templates/ws-substate/ws.selectors-dispatchers.tpl',
                            abortOnFail: false
                        });

                        //Add ws slices file
                        actions.push({
                            type: 'add',
                            path: storeDirectory + 'ws/ws.slice.ts',
                            templateFile: 'templates/ws-substate/ws.slice.tpl',
                            abortOnFail: false
                        });

                        //If ws files are just created
                        if (wsCreation)
                        {
                            //Append generic substate reducer import to store
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(\nexport function rootReducer)/gi,
                                template: 'import { wsReducer } from \'./ws/ws.slice\';\n$1'
                            });

                            //Append generic substate reducer
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(\s*\t*\/\/Reducers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: '\n\t\tws: wsReducer,$1'
                            });

                            if (verifyIfStringInFileExists("export {};", getSrcFileAbsolutePath("store/index.ts")))
                            {
                                //Remove default export {}; from index
                                actions.push({
                                    type: 'modify',
                                    pattern: /(export\s*\{\s*\};)/gi,
                                    path: storeDirectory + 'index.ts',
                                    template: ''
                                });
                            }

                            //Append Ws actions class to store index
                            actions.push({
                                type: 'append',
                                path: storeDirectory + 'index.ts',
                                template: 'export { WsActions } from \'./ws/ws.selectors-dispatchers\';'
                            });

                            //Append Ws actions class import to store module
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.module.ts',
                                pattern: /(\/\/Actions imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: 'WsActions,\n\t$1'
                            });

                            //Append Ws actions class provide to store module
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.module.ts',
                                pattern: /(\/\/Actions: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: 'WsActions,\n\t$1'
                            });
                        }

                        //Set a flag before provider creation to detect first initialization
                        var providerCreation = false;
                        if (!getSrcFileRelativePath(kebabCase(data.substateWsProvider)))
                            providerCreation = true;

                        //Create new provider class if doesn't exist yet
                        actions.push({
                            type: 'add',
                            path: '{{cwd}}/src/providers/{{ dashCase substateWsProvider }}.ts',
                            templateFile: 'templates/ws-substate/ws.provider.tpl',
                            abortOnFail: false
                        });

                        //Create provider index file if doesn't exist yet
                        actions.push({
                            type: 'add',
                            path: '{{cwd}}/src/providers/index.ts',
                            template: '',
                            abortOnFail: false
                        });

                        //Add provider call to provider
                        actions.push({
                            type: 'modify',
                            path: '{{cwd}}/src/providers/{{ dashCase substateWsProvider }}.ts',
                            pattern: /(\/\/Provider calls: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                            templateFile: 'templates/ws-substate/ws.provider-call.tpl'
                        });

                        if (providerCreation)
                        {
                            //Append provider to index
                            actions.push({
                                type: 'append',
                                path: '{{cwd}}/src/providers/index.ts',
                                template: 'export { {{ pascalCase substateWsProvider }}Provider } from \'./{{ dashCase substateWsProvider }}\';'
                            });

                            //If providers import exists, add a new one
                            var slicePath = getSrcFileAbsolutePath('ws.slice.ts');
                            if (slicePath && verifyIfStringInFileExists('../../providers', slicePath))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'ws/ws.slice.ts',
                                    pattern: /(\n} from \'..\/..\/providers)/gi,
                                    template: ',\n\t{{ pascalCase substateWsProvider }}Provider$1'
                                });
                            else
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'ws/ws.slice.ts',
                                    pattern: /(\/\/Ws providers imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: 'import {\n\t{{ pascalCase substateWsProvider }}Provider\n} from \'../../providers\';\n$1'
                                });

                            //Append provider provide to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(\s*\t*\/\/Ws providers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: '\n\t{ provide: {{ pascalCase substateWsProvider }}Provider },$1'
                            });

                            //Append provider instance to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(\s*\t*\/\/Ws providers: PLEASE DON'T DELETE THIS PLACEHOLDER\s*\t*\n*]*}*\)*;*)/gi,
                                template: '$1\nconst {{camelCase substateWsProvider}}Provider = wsProvidersInjector.get({{pascalCase substateWsProvider}}Provider);'
                            });
                        }

                        //Append new thunk to ws slice
                        actions.push({
                            type: 'modify',
                            path: storeDirectory + 'ws/ws.slice.ts',
                            pattern: /(\s*\t*\/\/Ws thunks: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                            template: '\nexport const {{ camelCase substateWsAction }}Thunk = prepareThunk(\'ws\', \'{{ camelCase substateWsAction }}\', {{camelCase substateWsProvider}}Provider.{{ camelCase substateWsAction }});$1'
                        });

                        //Append thunk import in ws selectors dispatchers file
                        actions.push({
                            type: 'modify',
                            path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                            pattern: /(\/\/Thunks imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                            template: '{{ camelCase substateWsAction }}Thunk,\n\t$1'
                        });

                        //Append new action to trigger thunk execution
                        actions.push({
                            type: 'modify',
                            path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                            pattern: /(\/\/Actions: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                            templateFile: 'templates/ws-substate/ws.action.tpl'
                        });

                        //Ws substate data adapter logics
                        if (data.substateWsUseAdapter)
                        {
                            //Create ws substate data dto
                            actions.push({
                                type: 'add',
                                path: '{{cwd}}/src/entities/dto/{{ camelCase substateWsName }}DTO.ts',
                                templateFile: 'templates/ws-substate/ws.dto.tpl'
                            });

                            //Add dto import to ws substate model
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.model.ts',
                                pattern: /(\/\/Dto imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: 'import { {{ pascalCase substateWsName }}DTO } from \'../../entities/dto/{{ camelCase substateWsName }}DTO\';\n$1'
                            });

                            //Add new data adapter to ws model
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.model.ts',
                                pattern: /(export const INITIAL_STATE_WEB_SERVICES)/gi,
                                templateFile: 'templates/ws-substate/ws.adapter.tpl'                               
                            });

                            //Append new data to ws model
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.model.ts',
                                pattern: /(\s*\t*\/\/Ws data: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: '\n\t{ \'{{ camelCase substateWsName }}\': { data: {{ camelCase substateWsName }}Adapter.getInitialState() }},$1'
                            });

                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'index.ts',
                                pattern: /(\{\s*WsActions\s*\})/gi,
                                template: '{\n\tWsActions\n}'
                            });

                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'index.ts',
                                pattern: /(WsActions)/gi,
                                template: '{{ camelCase substateWsName }}Object, {{ camelCase substateWsName }}Array, {{ camelCase substateWsName }}Count,\n\t$1'
                            });

                            //Append adapter import to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(INITIAL_STATE_WEB_SERVICES\n} from '.\/ws.model')/gi,
                                template: '{{ camelCase substateWsName }}Adapter,\n\t$1'
                            });

                            //Append substate reducer to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(\s*\t*\/\/Ws prepare thunks: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: '\n\t\t{ thunk: {{ camelCase substateWsAction }}Thunk, substate: \'{{ camelCase substateWsName }}\', adapter: {{ camelCase substateWsName }}Adapter },$1'
                            });

                            //Append adapter import to ws selectors dispatchers
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                pattern: /(\/\/Adapters imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: 'import { {{ camelCase substateWsName }}Adapter } from \'./ws.model\';\n$1'
                            });

                            //Append default with adapter selectors
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                pattern: /(\/\/Selectors: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                templateFile: 'templates/ws-substate/ws.selectors.tpl'
                            });
                        }
                        else    //Not using ws substate data adapter logics
                        {
                            //Append new data to ws model
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.model.ts',
                                pattern: /(\s*\t*\/\/Ws data: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: '\n\t\'{{ camelCase substateWsName }}\',$1'
                            });

                            //Append substate reducer to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(\s*\t*\/\/Ws prepare thunks: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: '\n\t\t{ thunk: {{ camelCase substateWsAction }}Thunk, substate: \'{{ camelCase substateWsName }}\', adapter: null },$1'
                            });
                        }
                    }
                }
                else if (data.operation === 'persist')
                {
                    if (data.persistSubstate && data.persistSubstate.length && verifyIfWholeWordInFileExists(data.persistSubstate, getSrcFileAbsolutePath("store/store.reducer.ts")))
                    {
                        const regex = /\:\s*/gi;
                        const reducerRegex = new RegExp(data.persistSubstate + 'Reducer,', 'gi');

                        if (data.persistSecure)
                        {
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: new RegExp(regex.source + reducerRegex.source),
                                template: ': {{persistSubstate}}SecurePersistedReducer,'
                            });

                            const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(\/\/Persisted reducers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: 'const {{persistSubstate}}SecurePersistedReducer = createSecureStoredReducer(\'{{persistSubstate}}\', \'' + key + '\', storage, {{persistSubstate}}Reducer);\n\t$1'
                            });
                        }
                        else
                        {
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: new RegExp(regex.source + reducerRegex.source),
                                template: ': {{persistSubstate}}PersistedReducer,'
                            });
    
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(\/\/Persisted reducers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                template: 'const {{persistSubstate}}PersistedReducer = createStoredReducer(\'{{persistSubstate}}\', storage, {{persistSubstate}}Reducer);\n\t$1'
                            });
                        }
                    }
                    else
                        console.log("Substate not found");
                }
                else if (data.operation === 'epic')
                {
                    if (data.epicSubstate && data.epicSubstate.length && verifyIfWholeWordInFileExists(camelCase(data.epicSubstate), getSrcFileAbsolutePath("store/store.reducer.ts")))
                    {
                        if (data.epicName && data.epicName.length)
                        {
                            if (data.epicOnTriggerAction && data.epicOnTriggerAction.length && 
                                verifyIfWholeWordInFileExists(camelCase(data.epicOnTriggerAction), getSrcFileAbsolutePath(kebabCase(data.epicSubstate) + '.slice.ts')))
                            {
                                actions.push({
                                    type: 'add',
                                    path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                    templateFile: 'templates/substate/substate.epics.tpl',
                                    skipIfExists: true
                                });

                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                    pattern: /(\/\/Actions imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: '{{ camelCase epicOnTriggerAction }},\n\t$1'
                                });

                                actions.push({
                                    type: 'append',
                                    path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                    templateFile: 'templates/substate/substate.epic.tpl',
                                });

                                //if (data.epicStatic)
                                //{
                                    /*if (verifyIfStringInFileExists(kebabCase(data.epicSubstate) + '.epics', getSrcFileAbsolutePath('store/epics.ts')))
                                    {
                                        actions.push({
                                            type: 'modify',
                                            path: storeDirectory + 'epics.ts',
                                            pattern: new RegExp(/(\}(\s*)from(\s*)\'.\/)/gi.source + new RegExp(kebabCase(data.epicSubstate), 'gi').source),
                                            template: ', {{ camelCase epicName }} $1'
                                        });
                                    }
                                    else
                                    {*/
                                        actions.push({
                                            type: 'modify',
                                            path: storeDirectory + 'epics.ts',
                                            pattern: /(\/\/Epics imports: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                            template: 'import { {{ camelCase epicName }} } from \'./{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics\';\n$1'
                                        });
                                    //}

                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'epics.ts',
                                        pattern: /(\/\/Epics: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                        template: '{{ camelCase epicName }}(),\n\t\t$1'
                                    });
                                /*}
                                else
                                {

                                }*/
                            }
                            else
                                console.log("Cannot find the typed action to trigger");
                        }
                        else
                            console.log("Please insert an epic name");
                    }
                    else
                        console.log("Substate not found");
                }
                else if (data.operation === 'saga')
                {

                }

                return actions;
            }
        });
    }
};
