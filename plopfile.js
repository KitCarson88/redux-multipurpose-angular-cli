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
                type: 'input',
                name: 'substateName',
                message: 'Name? (Please use spaces instead of camel case, dash case, or other notations)'
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
                    return response.operation === 'substate';
                },
                type: 'input',
                name: 'substateActions',
                message: 'Do you want to add some actions?\n(Please insert them in camel case, or with spaces, separated by comma; or leave it blank to skip this step)'
            }, {
                when: function(response) {
                    return response.operation === 'substate';
                },
                type: 'confirm',
                name: 'substateStatic',
                message: 'Do you want to add the reducer statically\n(alternatively you can add it dynamically everywhere in your code)'
            }],
            actions: function(data) {
                var actions = [];

                if (data.operation === 'substate')
                {
                    if (!data.substateWs)
                    {
                        if (data.substateName && data.substateType)
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

                            actions.push({
                                type: 'add',
                                path: getStoreDirectory() + '{{ camelCase substateName }}/{{ camelCase substateName }}.model.ts',
                                templateFile: 'templates/substate/substate.model.tpl'
                            });
                            actions.push({
                                type: 'add',
                                path: getStoreDirectory() + '{{ camelCase substateName }}/{{ camelCase substateName }}.slice.ts',
                                templateFile: 'templates/substate/substate.slice.tpl'
                            });

                            if (data.substateActions && data.substateActions.length)
                            {
                                var actionArray = data.substateActions.split(',');
                                for (var i = 0; i < actionArray.length; ++i)
                                actionArray[i] = actionArray[i].trim();
                                    data.actionArray = actionArray;

                                plop.setPartial('stateType', pascalCase(data.substateName) + 'State');

                                actions.push({
                                    type: 'add',
                                    path: getStoreDirectory() + '{{ camelCase substateName }}/{{ camelCase substateName }}.selectors-dispatchers.ts',
                                    templateFile: 'templates/substate/substate.selectors-dispatchers.tpl'
                                });
                            }

                            if (data.substateStatic)
                            {
                                actions.push({
                                    type: 'modify',
                                    path: getStoreDirectory() + 'store.reducer.ts',
                                    pattern: /(\s*\t*export function rootReducer)/gi,
                                    template: '\n\nimport { {{ camelCase substateName }}Reducer } from \'./{{ camelCase substateName }}/{{ camelCase substateName }}.reducer.ts\';$1'
                                });

                                actions.push({
                                    type: 'modify',
                                    path: getStoreDirectory() + 'store.reducer.ts',
                                    pattern: /(\s*\t*\/\/Reducers: PLEASE DON'T DELETE THIS PLACEHOLDER)/gi,
                                    template: '\n\t\t{{ camelCase substateName }}: {{ camelCase substateName }}Reducer,$1'
                                });
                            }
                        }
                    }
                }

                return actions;
            }
        });
    }
};
