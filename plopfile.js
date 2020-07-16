const glob = require('glob-promise');
const fs = require('fs');
const { cwd } = require('process');

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

function getStoreDirectory()
{
    var filePath = getSrcFileRelativePath('store.module');
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

function verifyIfStringInFileExists(value, pathFile)
{
    var file = fs.readFileSync(pathFile).toString();
    return file.indexOf(value) >= 0;
}

function pascalCase(value)
{
    var tokens = value.split(' ');
    for (var i = 0; i < tokens.length; ++i)
        if (tokens[i].length > 1)
            tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].substring(1);
        else if (tokens[i].length == 1)
            tokens[i] = tokens[i].toUpperCase();
    return tokens.join('');
}

function dashCase(value)
{
    var tokens = value.split(' ');
    return tokens.join('-');
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
                    { value: 'epic', name: 'Create epic' }
                ]
            }, {
                when: function(response) {
                    return response.operation === 'substate';
                },
                type: 'confirm',
                name: 'substateWs',
                message: 'Is it a web service wrapper state?'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && !response.substateWs;
                },
                type: 'input',
                name: 'substateNoWsName',
                message: 'Name? (Please use spaces instead of camel case, dash case, or other notations)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateWs;
                },
                type: 'input',
                name: 'substateWsName',
                message: 'Data name? (Please use spaces instead of camel case, dash case, or other notations)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && !response.substateWs;
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
                    return response.operation === 'substate' && !response.substateWs;
                },
                type: 'input',
                name: 'substateNoWsActions',
                message: 'Do you want to add some actions?\n(Please insert them in camel case, or with spaces, separated by comma; or leave it blank to skip this step)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateWs;
                },
                type: 'confirm',
                name: 'substateWsUseAdapter',
                message: 'Do you want to use an adapter for your data? (Useful when you want data indexing and auto data ordering on retrieve)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateWs;
                },
                type: 'input',
                name: 'substateWsAction',
                message: 'What is the name of data retrieve action?\n(Please insert it in camel case or with spaces; e.g. getExamples, setExampleData, retrieve data, etc.)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateWs;
                },
                type: 'input',
                name: 'substateWsProvider',
                message: 'Insert a provider name. Please provide the same name if you want to add another call to the same provider.\n(Please use spaces instead of camel case, dash case, or other notations)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && !response.substateWs;
                },
                type: 'confirm',
                name: 'substateNoWsStatic',
                message: 'Do you want to add the reducer statically\n(alternatively you can add it dynamically everywhere in your code)'
            }, {
                when: function(response) {
                    return response.operation === 'substate' && response.substateWs;
                },
                type: 'confirm',
                name: 'substateWsStatic',
                message: 'Do you want to insert redux wrapper statically in ws substate?\n(alternatively you can add it dynamically everywhere in your code as new substate)'
            }],
            actions: function(data) {
                var actions = [];
                var storeDirectory = getStoreDirectory();

                if (data.operation === 'substate')
                {
                    //Generic substate creation logics
                    if (!data.substateWs)
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
                                    template: 'import { {{ camelCase substateNoWsName }}Reducer } from \'./{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.reducer.ts\';\n$1'
                                });

                                //Append generic substate reducer
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.reducer.ts',
                                    pattern: /(\s*\t*\/\/Reducers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: '\n\t\t{{ camelCase substateNoWsName }}: {{ camelCase substateNoWsName }}Reducer,$1'
                                });
                            }
                        }
                    }
                    else    //Ws substate creation logics
                    {
                        //Static ws substate creation logics
                        if (data.substateWsStatic)
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
                            if (!getSrcFileRelativePath(dashCase(data.substateWsProvider)))
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
                                pattern: /(constructor\(\) {})/gi,
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
                                    template: '\n\t{ \'{{ camelCase substateWsName }}Adapter\': { data: {{ camelCase substateWsName }}Adapter.getInitialState() }},$1'
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
                        else
                        {

                        }
                    }
                }

                return actions;
            }
        });
    }
};
