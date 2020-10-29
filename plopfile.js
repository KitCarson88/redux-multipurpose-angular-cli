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

function matchRegex(regex, pathFile)
{
    var file = fs.readFileSync(pathFile).toString();
    const ret = file.match(regex);

    //console.log("Regex matched: ", ret);

    return ret && ret.length > 0;
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
                    { value: 'responsiveness', name: 'Responsiveness (redux-responsive)' },
                    { value: 'logger', name: 'Logger (redux-logger)' }
                ]
            }, {
                type: 'input',
                name: 'routerKey',
                message: 'Do you want to enable angular router reducer? Leave it blank if you don\'t need it; otherwise digit a key name to the reducer (e.g. router)'
            }, {
                type: 'input',
                name: 'breakpoints',
                when: function(response) {
                    return response.configurations.indexOf('responsiveness') >= 0;
                },
                message: 'Do you want to customize responsiveness breakpoints? (Insert them separated by commas, or leave blank to use defaults)\ndefault are 480, 768, 992, 1200: '
            }],
            actions: function(data) {
                var actions = [];

                if (data.configurations.indexOf('epics') >= 0)
                    data.enableEpics = true;
                if (data.configurations.indexOf('sagas') >= 0)
                    data.enableSagas = true;
                if (data.configurations.indexOf('persistence') >= 0)
                    data.enablePersistence = true;
                if (data.configurations.indexOf('responsiveness') >= 0)
                    data.enableResponsiveness = true;
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

                if (data.breakpoints)
                {
                    var breaks = data.breakpoints.split(',');
                    for (var i = 0; i < breaks.length; ++i)
                    {
                        breaks[i] = breaks[i].trim();

                        if (breaks[i] === '')
                            breaks.splice(i, 1);
                    }

                    if (breaks.length >= 5)
                    {
                        data.breakpoint1 = breaks[0];
                        data.breakpoint2 = breaks[1];
                        data.breakpoint3 = breaks[2];
                        data.breakpoint4 = breaks[3];
                        data.breakpoint5 = breaks[4];
    
                        actions.push({
                            type: 'modify',
                            path: '{{cwd}}/' + data.storeDir + '/store/store.module.ts',
                            pattern: /(enableResponsiveness\s*:\s*)(true)/,
                            templateFile: 'templates/store.responsiveness-configuration.tpl' 
                        });
                    }
                    else
                        console.log("Please provide at least five breakpoints to customize responsiveness");
                }

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
                    { value: 'saga', name: 'Create saga' }
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
                message: 'Do you want to add some actions?\n(Please insert them separated by commas; or leave it blank to skip this step)'
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
                    return response.operation === 'substate' && response.substateFunction === 'generic' && !response.substateNoWsStatic && response.substateNoWsStaticMountOnComponent && response.substateNoWsStaticMountOnComponent.length;
                },
                type: 'input',
                name: 'substateNoWsStaticUnmountOnComponent',
                message: 'Do you want to unmount the reducer automatically at the destroy of a component or a page?\n(type the name of the ts file that contains the page or component, otherwise leave it blank)'
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
                name: 'epicOnTriggerAction',
                message: 'What is the launch existent action to trigger?'
            }, {
                when: function(response) {
                    return response.operation === 'epic';
                },
                type: 'input',
                name: 'epicName',
                message: 'Give a name to the epic method:'
            }, {
                when: function(response) {
                    return response.operation === 'epic';
                },
                type: 'confirm',
                name: 'epicStatic',
                message: 'Do you want to add the epic statically?\n(alternatively you can add it dynamically everywhere in your code)'
            }, {
                when: function(response) {
                    return response.operation === 'saga';
                },
                type: 'input',
                name: 'sagaOnTriggerAction',
                message: 'Please provide the full trigger action type:'
            }, {
                when: function(response) {
                    return response.operation === 'saga';
                },
                type: 'input',
                name: 'sagaName',
                message: 'Give a name to the saga method:'
            },],
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

                            //Setting data to add actions in substate slice
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

                            //Static generic substate reducer add logics
                            if (data.substateNoWsStatic)
                            {
                                //Create generic substate selectors and dispatchers file
                                actions.push({
                                    type: 'add',
                                    path: storeDirectory + '{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.selectors-dispatchers.ts',
                                    templateFile: 'templates/substate/substate.selectors-dispatchers.tpl'
                                });

                                if (matchRegex(/(export\s*\{\s*\}\s*;)/gi, getSrcFileAbsolutePath("store/index.ts")))
                                {
                                    //Remove default export {}; from index
                                    actions.push({
                                        type: 'modify',
                                        pattern: /(export\s*\{\s*\}\s*;)/gi,
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
                                if (verifyIfStringInFileExists("//Actions imports:", getSrcFileAbsolutePath('store.module.ts')))
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'store.module.ts',
                                        pattern: /(\/\/Actions imports: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER)/gi,
                                        template: '{{ pascalCase substateNoWsName}}Actions'
                                    });
                                else
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'store.module.ts',
                                        pattern: /(\n\s*\}\s*from\s*\'.\/index\'\s*;)/gi,
                                        template: ',\n\t{{ pascalCase substateNoWsName}}Actions$1'
                                    });

                                //Add actions class to store module provide
                                if (verifyIfStringInFileExists("//Actions:", getSrcFileAbsolutePath('store.module.ts')))
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'store.module.ts',
                                        pattern: /(\/\/Actions: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER)/gi,
                                        template: '{{ pascalCase substateNoWsName}}Actions'
                                    });
                                else
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'store.module.ts',
                                        pattern: /(const\s*ACTIONS\s*=\s*\[(\s*\n*\w*Actions\b\,*)*)/gi,
                                        template: '$1,\n\t{{ pascalCase substateNoWsName}}Actions'
                                    });

                                //Append generic substate reducer import to store
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.reducer.ts',
                                    pattern: /(\nexport function rootReducer)/gi,
                                    template: 'import { {{ camelCase substateNoWsName }}Reducer } from \'./{{ dashCase substateNoWsName }}/{{ dashCase substateNoWsName }}.slice\';\n$1'
                                });

                                //Append generic substate reducer
                                if (verifyIfStringInFileExists("//Reducers:", getSrcFileAbsolutePath('store.reducer.ts')))
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'store.reducer.ts',
                                        pattern: /(\/\/Reducers: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER)/gi,
                                        template: '{{ camelCase substateNoWsName }}: {{ camelCase substateNoWsName }}Reducer'
                                    });
                                else
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'store.reducer.ts',
                                        pattern: /(return\s*\n*\{(\s*\n*\w*\s*\:\s*\w*Reducer\b\,*)*)/,
                                        template: '$1,\n\t\t{{ camelCase substateNoWsName }}: {{ camelCase substateNoWsName }}Reducer'
                                    });
                            }
                            else
                            {
                                //Dynamic on component mount
                                var justAddedInjector = false;
                                if (data.substateNoWsStaticMountOnComponent && data.substateNoWsStaticMountOnComponent.length)
                                {
                                    if (!data.substateNoWsStaticMountOnComponent.endsWith('.ts'))
                                        data.substateNoWsStaticMountOnComponent += '.ts';
                                    var path = getSrcFileAbsolutePath(data.substateNoWsStaticMountOnComponent);

                                    if (path)
                                    {
                                        if (verifyIfStringInFileExists("@Component", path))
                                        {
                                            if (!verifyIfStringInFileExists("@ReducerInjector", path))
                                            {
                                                if (!verifyIfStringInFileExists("@redux-multipurpose/core", path))
                                                {
                                                    //Append ReducerInjector decorator import
                                                    actions.push({
                                                        type: 'modify',
                                                        path,
                                                        pattern: /('@angular\/core';*)/,
                                                        template: '$1\n\nimport { ReducerInjector } from \'@redux-multipurpose/core\';\n'
                                                    });
                                                    justAddedInjector = true;
                                                }
                                                else
                                                {
                                                    //Append ReducerInjector decorator to core imports
                                                    actions.push({
                                                        type: 'modify',
                                                        path,
                                                        pattern: /(\s*\}\s*from\s*\'\s*@redux-multipurpose\/core)/,
                                                        template: ', ReducerInjector$1'
                                                    });
                                                }

                                                //Append ReducerInjector decorator
                                                actions.push({
                                                    type: 'modify',
                                                    path,
                                                    pattern: /(@Component\s*\(\s*\{(.|\s)+?(?=\})\}\s*\))/gi,
                                                    template: '$1\n@ReducerInjector([{\n\tkey: \'{{ camelCase substateNoWsName }}\',\n\treducer: {{ camelCase substateNoWsName }}Reducer\n}])'
                                                });
                                            }
                                            else
                                                actions.push({
                                                    type: 'modify',
                                                    path,
                                                    pattern: /(@ReducerInjector\s*\(\s*\[(\s*\{(.|\s)+?(?=\})\}\s*,*)*)/,
                                                    templateFile: 'templates/substate/substate.reducer-component-injection.tpl',
                                                });

                                            //Append dynamic reducer import
                                            if (path && !verifyIfStringInFileExists(camelCase(data.substateNoWsName) + "Reducer", path))
                                                actions.push({
                                                    type: 'modify',
                                                    path,
                                                    pattern: /(\s*\}\s*from\s*\'\s*@redux-multipurpose\/core\s*\'\s*;\s*)/,
                                                    template: '$1import { {{ camelCase substateNoWsName}}Reducer } from \'' + getStoreDirectory(false) + '{{ dashCase substateNoWsName}}/{{ dashCase substateNoWsName}}.slice\';\n'
                                                });
                                        }
                                        else
                                            console.log("File " + path + " not recognized as a component");
                                    }
                                }

                                //Dynamic on component unmount
                                if (data.substateNoWsStaticUnmountOnComponent && data.substateNoWsStaticUnmountOnComponent.length)
                                {
                                    if (!data.substateNoWsStaticUnmountOnComponent.endsWith('.ts'))
                                        data.substateNoWsStaticUnmountOnComponent += '.ts';
                                    var path = getSrcFileAbsolutePath(data.substateNoWsStaticUnmountOnComponent);

                                    if (path)
                                    {
                                        if (verifyIfStringInFileExists("@Component", path))
                                        {
                                            if (!verifyIfStringInFileExists("@ReducerDeallocator", path))
                                            {
                                                if (!verifyIfStringInFileExists("@redux-multipurpose/core", path) && !justAddedInjector)
                                                {
                                                    //Append ReducerDeallocator decorator import
                                                    actions.push({
                                                        type: 'modify',
                                                        path,
                                                        pattern: /('@angular\/core';*)/,
                                                        template: '$1\n\nimport { ReducerDeallocator } from \'@redux-multipurpose/core\';\n'
                                                    });
                                                }
                                                else
                                                {
                                                    //Append ReducerDeallocator decorator to core imports
                                                    actions.push({
                                                        type: 'modify',
                                                        path,
                                                        pattern: /(\s*\}\s*from\s*\'\s*@redux-multipurpose\/core)/,
                                                        template: ', ReducerDeallocator$1'
                                                    });
                                                }

                                                //Append ReducerDeallocator decorator
                                                var template = '$1\n@ReducerDeallocator([\'{{ camelCase substateNoWsName }}\'])';
                                                if (data.substateNoWsStaticUnmountOnComponent === data.substateNoWsStaticMountOnComponent || verifyIfStringInFileExists("@ReducerInjector", path))
                                                    actions.push({
                                                        type: 'modify',
                                                        path,
                                                        pattern: /(@ReducerInjector\s*\(\s*\[(.|\s)+?(?=\])\]\s*\))/gi,
                                                        template 
                                                    });
                                                else
                                                    actions.push({
                                                        type: 'modify',
                                                        path,
                                                        pattern: /(@Component\s*\(\s*\{(.|\s)+?(?=\})\}\s*\))/gi,
                                                        template
                                                    });
                                            }
                                            else
                                                actions.push({
                                                    type: 'modify',
                                                    path,
                                                    pattern: /(@ReducerDeallocator\s*\(\s*\[(\s*\'.+?(?=\')\',*)*)/,
                                                    template: '$1, \'{{ camelCase substateNoWsName }}\'',
                                                });
                                        }
                                        else
                                            console.log("File " + path + " not recognized as a component");
                                    }
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
                            //Append ws reducer import to store
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(\nexport function rootReducer)/gi,
                                template: 'import { wsReducer } from \'./ws/ws.slice\';\n$1'
                            });

                            //Append ws reducer
                            if (verifyIfStringInFileExists("//Reducers:", getSrcFileAbsolutePath('store.reducer.ts')))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.reducer.ts',
                                    pattern: /(\/\/Reducers: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER)/gi,
                                    template: 'ws: wsReducer'
                                });
                            else
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.reducer.ts',
                                    pattern: /(return\s*\n*\{(\s*\n*\w*\s*\:\s*\w*Reducer\b\,*)*)/,
                                    template: '$1,\n\t\tws: wsReducer'
                                });

                            if (matchRegex(/(export\s*\{\s*\}\s*;)/gi, getSrcFileAbsolutePath("store/index.ts")))
                            {
                                //Remove default export {}; from index
                                actions.push({
                                    type: 'modify',
                                    pattern: /(export\s*\{\s*\}\s*;)/gi,
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
                            if (verifyIfStringInFileExists("//Actions imports:", getSrcFileAbsolutePath('store.module.ts')))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.module.ts',
                                    pattern: /(\/\/Actions imports: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER)/gi,
                                    template: 'WsActions'
                                });
                            else
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.module.ts',
                                    pattern: /(\n\s*\}\s*from\s*\'.\/index\'\s*;)/gi,
                                    template: ',\n\tWsActions$1'
                                });

                            //Append Ws actions class provide to store module
                            if (verifyIfStringInFileExists("//Actions:", getSrcFileAbsolutePath('store.module.ts')))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.module.ts',
                                    pattern: /(\/\/Actions: PLEASE DON'T DELETE OR MODIFY THIS PLACEHOLDER)/gi,
                                    template: 'WsActions'
                                });
                            else
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'store.module.ts',
                                    pattern: /(const\s*ACTIONS\s*=\s*\[(\s*\n*\w*Actions\b\,*)*)/gi,
                                    template: '$1,\n\tWsActions'
                                });
                        }

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
                            template: 'export { {{ pascalCase substateWsProvider }}Provider } from \'./{{ dashCase substateWsProvider }}\';',
                            abortOnFail: false
                        });

                        //Add provider call to provider
                        actions.push({
                            type: 'modify',
                            path: '{{cwd}}/src/providers/{{ dashCase substateWsProvider }}.ts',
                            pattern: /(export\s*class\s*\w*Provider\b\s*\n*\{)/,
                            templateFile: 'templates/ws-substate/ws.provider-call.tpl'
                        });

                        //Append provider to index
                        var indexPath = getSrcFileAbsolutePath("providers/index.ts");
                        if (indexPath && !verifyIfStringInFileExists(pascalCase(data.substateWsProvider) + "Provider", indexPath))
                            actions.push({
                                type: 'append',
                                path: '{{cwd}}/src/providers/index.ts',
                                template: 'export { {{ pascalCase substateWsProvider }}Provider } from \'./{{ dashCase substateWsProvider }}\';'
                            });

                        var slicePath = getSrcFileAbsolutePath("ws.slice.ts");
                        if (slicePath && !verifyIfStringInFileExists(pascalCase(data.substateWsProvider) + "Provider", slicePath))
                        {
                            //Add the new provider import
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(\n\s*}\s*from\s*\'..\/..\/providers)/,
                                template: ',\n\t{{ pascalCase substateWsProvider }}Provider$1'
                            });

                            //Append provider provide to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(Injector\s*\.\s*create\s*\(\s*\{\s*providers\s*\:\s*\[(\s*\n*\{\s*provide\s*\:\s*\w*Provider\b\s*\}\,*)*)/gi,
                                template: '$1,\n\t{ provide: {{ pascalCase substateWsProvider }}Provider }'
                            });

                            //Append provider instance to ws slice
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(\]\s*\n*\}\s*\n*\)\s*\n*\;\n(\s*\n*const\s*\w*Provider\b\s*\=\s*wsProvidersInjector\s*\.\s*get\s*\(\s*\w*Provider\b\)\s*\;)*)/gi,
                                template: '$1\nconst {{camelCase substateWsProvider}}Provider = wsProvidersInjector.get({{pascalCase substateWsProvider}}Provider);'
                            });
                        }

                        //Append new thunk to ws slice
                        if (slicePath && !verifyIfStringInFileExists(camelCase(data.substateWsAction) + "Thunk", slicePath))
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.slice.ts',
                                pattern: /(export\s*const\s*\w*Thunk\b)/,
                                template: 'export const {{ camelCase substateWsAction }}Thunk = prepareThunk(\'ws\', \'{{ camelCase substateWsAction }}\', {{camelCase substateWsProvider}}Provider.{{ camelCase substateWsAction }});\n$1'
                            });

                        var selectorsDispatchersPath = getSrcFileAbsolutePath("ws.selectors-dispatchers.ts");
                        
                        if (selectorsDispatchersPath && !verifyIfStringInFileExists(camelCase(data.substateWsAction) + "Thunk", selectorsDispatchersPath))
                        {
                            //Append thunk import in ws selectors dispatchers file
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                pattern: /(\n\s*\}\s*from\s*\'\.\/ws\.slice\'\s*\;)/,
                                template: ',\n\t{{ camelCase substateWsAction }}Thunk$1'
                            });

                            //Append new action to trigger thunk execution
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                pattern: /(export\s*class\s*WsActions\s*\n*\{)/,
                                templateFile: 'templates/ws-substate/ws.action.tpl'
                            });
                        }

                        var modelPath = getSrcFileAbsolutePath("ws.model.ts");

                        //Ws substate data adapter logics
                        data.substateWsNotUseAdapter = !data.substateWsUseAdapter;
                        if (data.substateWsUseAdapter)
                        {
                            //Create ws substate data dto
                            actions.push({
                                type: 'add',
                                path: '{{cwd}}/src/entities/dto/{{ camelCase substateWsName }}DTO.ts',
                                templateFile: 'templates/ws-substate/ws.dto.tpl'
                            });

                            //Add dto import to ws substate model
                            if (modelPath && !verifyIfStringInFileExists(pascalCase(data.substateWsName) + "DTO", modelPath))
                            {
                                if (matchRegex(/(\w*DTO\b)/, modelPath))
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'ws/ws.model.ts',
                                        pattern: /(\'\@redux\-multipurpose\/core'\s*\;\n*)/,
                                        template: '$1import { {{ pascalCase substateWsName }}DTO } from \'../../entities/dto/{{ camelCase substateWsName }}DTO\';\n'
                                    });
                                else
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'ws/ws.model.ts',
                                        pattern: /(\'\@redux\-multipurpose\/core'\s*\;\n*)/,
                                        template: '$1import { {{ pascalCase substateWsName }}DTO } from \'../../entities/dto/{{ camelCase substateWsName }}DTO\';\n\n'
                                    });
                            }

                            //Add new data adapter to ws model
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.model.ts',
                                pattern: /(export\s*\n*const\s*\n*INITIAL_STATE_WEB_SERVICES)/gi,
                                templateFile: 'templates/ws-substate/ws.adapter.tpl'                               
                            });

                            //Append new data to ws model
                            if (modelPath && !verifyIfStringInFileExists(camelCase(data.substateWsName) + "Adapter", modelPath))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'ws/ws.model.ts',
                                    pattern: /(INITIAL_STATE_WEB_SERVICES\s*=\s*createWsInitialState\s*\(\s*\[\s*)/gi,
                                    template: '$1{ \'{{ camelCase substateWsName }}\': { data: {{ camelCase substateWsName }}Adapter.getInitialState({ available: null }) }},\n\t'
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
                                pattern: /(INITIAL_STATE_WEB_SERVICES\s*\n*}\s*\n*from\s*\n*\'\.\/ws.model\')/gi,
                                template: '{{ camelCase substateWsName }}Adapter,\n\t$1'
                            });

                            //Append substate reducer to ws slice
                            if (slicePath && !verifyIfStringInFileExists(camelCase(data.substateWsAction) + "Thunk", slicePath))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'ws/ws.slice.ts',
                                    pattern: /(extraReducers\s*\n*\:\s*\n*prepareThunkActionReducers\s*\n*\(\s*\n*\[\s*\n*)/gi,
                                    template: '$1{ thunk: {{ camelCase substateWsAction }}Thunk, substate: \'{{ camelCase substateWsName }}\', adapter: {{ camelCase substateWsName }}Adapter },\n\t\t'
                                });

                            //Append adapter import to ws selectors dispatchers
                            if (selectorsDispatchersPath && !verifyIfStringInFileExists(camelCase("substateWsName") + "Adapter", selectorsDispatchersPath))
                            {
                                if (!verifyIfStringInFileExists("'./ws.model'", selectorsDispatchersPath))
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                        pattern: /(from\s*'.\/ws.slice';*)/,
                                        template: '$1\n\nimport {\n\t{{ camelCase substateWsName }}Adapter\n} from \'./ws.model\';'
                                    });
                                else
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                        pattern: /(import\s*\{(\s*\w*Adapter\b,*)+)/,
                                        template: '$1,\n\t{{ camelCase substateWsName }}Adapter'
                                    });
                            }

                            //Append default with adapter selectors
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'ws/ws.selectors-dispatchers.ts',
                                pattern: /(\@Injectable\(\))/gi,
                                templateFile: 'templates/ws-substate/ws.selectors.tpl'
                            });
                        }
                        else    //Not using ws substate data adapter logics
                        {
                            //Append new data to ws model
                            if (modelPath && !verifyIfStringInFileExists("'" + camelCase(data.substateWsName) + "'", modelPath))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'ws/ws.model.ts',
                                    pattern: /(INITIAL_STATE_WEB_SERVICES\s*=\s*createWsInitialState\s*\(\s*\[\s*)/gi,
                                    template: '$1\'{{ camelCase substateWsName }}\',\n\t'
                                });

                            //Append substate reducer to ws slice
                            if (slicePath && !verifyIfStringInFileExists(camelCase(data.substateWsAction) + "Thunk", slicePath))
                                actions.push({
                                    type: 'modify',
                                    path: storeDirectory + 'ws/ws.slice.ts',
                                    pattern: /(extraReducers\s*\n*\:\s*\n*prepareThunkActionReducers\s*\n*\(\s*\n*\[\s*\n*)/gi,
                                    template: '$1{ thunk: {{ camelCase substateWsAction }}Thunk, substate: \'{{ camelCase substateWsName }}\', adapter: null },\n\t\t'
                                });
                        }
                    }
                }
                else if (data.operation === 'persist')
                {
                    if (data.persistSubstate && data.persistSubstate.length && verifyIfWholeWordInFileExists(camelCase(data.persistSubstate), getSrcFileAbsolutePath("store.reducer.ts")))
                    {
                        const regex = new RegExp(camelCase(data.persistSubstate) + /\s*\:\s*/.source + camelCase(data.persistSubstate) + "Reducer");

                        if (data.persistSecure)
                        {
                            //Replace reducer with secure persisted reducer
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: regex,
                                template: '{{camelCase persistSubstate}}: {{camelCase persistSubstate}}SecurePersistedReducer'
                            });

                            const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

                            //Add secure persisted reducer creation
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(export\s*function\s*rootReducer\s*\(.+?(?=\))\)\s*\{\s*)/gi,
                                template: '$1const {{camelCase persistSubstate}}SecurePersistedReducer = createSecureStoredReducer(\'{{camelCase persistSubstate}}\', \'' + key + '\', storage, {{camelCase persistSubstate}}Reducer);\n\n\t'
                            });
                        }
                        else
                        {
                            //Replace reducer with persisted reducer
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: regex,
                                template: '{{camelCase persistSubstate}}: {{camelCase persistSubstate}}PersistedReducer'
                            });
    
                            //Add persisted reducer creation
                            actions.push({
                                type: 'modify',
                                path: storeDirectory + 'store.reducer.ts',
                                pattern: /(export\s*function\s*rootReducer\s*\(.+?(?=\))\)\s*\{\s*)/gi,     //  .+?(?=abc) Match any characters as few as possible until a "abc" is found, without counting the "abc".
                                template: '$1const {{camelCase persistSubstate}}PersistedReducer = createStoredReducer(\'{{camelCase persistSubstate}}\', storage, {{camelCase persistSubstate}}Reducer);\n\n\t'
                            });
                        }
                    }
                    else
                        console.log("Substate not found");
                }
                else if (data.operation === 'epic')
                {
                    if (data.epicSubstate && data.epicSubstate.length && getSrcFileRelativePath(kebabCase(data.epicSubstate)))
                    {
                        if (data.epicName && data.epicName.length)
                        {
                            if (data.epicOnTriggerAction && data.epicOnTriggerAction.length && 
                                verifyIfWholeWordInFileExists(camelCase(data.epicOnTriggerAction), getSrcFileAbsolutePath(kebabCase(data.epicSubstate) + '.slice.ts')))
                            {
                                //Create epic file
                                actions.push({
                                    type: 'add',
                                    path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                    templateFile: 'templates/substate/substate.epics.tpl',
                                    skipIfExists: true
                                });

                                if (!getSrcFileAbsolutePath(kebabCase(data.epicSubstate) + '.epics.ts'))
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                        pattern: /(\'redux-observable-es6-compat\'\s*;\s*)/gi,
                                        template: '$1import {\n\t{{ camelCase epicOnTriggerAction }}\n} from \'./{{ dashCase epicSubstate }}.slice\';'
                                    });
                                else if (!verifyIfStringInFileExists(camelCase(data.epicOnTriggerAction), getSrcFileAbsolutePath(kebabCase(data.epicSubstate) + '.epics.ts')))
                                    //If the trigger action wasn't added yet, adding it to imports
                                    actions.push({
                                        type: 'modify',
                                        path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                        pattern: new RegExp(/(\s*\}\s*from\s*\'\.\/)/gi.source + new RegExp("(" + kebabCase(data.epicSubstate) + ".slice)").source),
                                        template: ',\n\t{{ camelCase epicOnTriggerAction }}$1$2'
                                    });

                                //Append new epic
                                actions.push({
                                    type: 'append',
                                    path: storeDirectory + '{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics.ts',
                                    templateFile: 'templates/substate/substate.epic.tpl',
                                });

                                if (data.epicStatic)
                                {
                                    if (verifyIfStringInFileExists(kebabCase(data.epicSubstate) + '.epics', getSrcFileAbsolutePath('store/epics.ts')))
                                    {
                                        const regex = new RegExp(/(\s*\}\s*from\s*\'\.\/\s*)/gi.source + new RegExp('(' + kebabCase(data.epicSubstate) + ')', 'gi').source);
                                        actions.push({
                                            type: 'modify',
                                            path: storeDirectory + 'epics.ts',
                                            pattern: regex,
                                            template: ', {{ camelCase epicName }}$1$2'
                                        });
                                    }
                                    else
                                        actions.push({
                                            type: 'modify',
                                            path: storeDirectory + 'epics.ts',
                                            pattern: /(var\s*staticEpics\s*=\s*\[)/gi,
                                            template: 'import { {{ camelCase epicName }} } from \'./{{ dashCase epicSubstate }}/{{ dashCase epicSubstate }}.epics\';\n\n$1'
                                        });

                                    if (matchRegex(/(var\s*staticEpics\s*=\s*\[\s*\])/gi, getSrcFileAbsolutePath('store/epics.ts')))
                                        actions.push({
                                            type: 'modify',
                                            path: storeDirectory + 'epics.ts',
                                            pattern: /(var\s*staticEpics\s*=\s*\[)\s*(\])/gi,
                                            template: '$1\n\t{{ camelCase epicName }}\n$2'
                                        });
                                    else
                                        actions.push({
                                            type: 'modify',
                                            path: storeDirectory + 'epics.ts',
                                            pattern: /(var\s*staticEpics\s*=\s*\[)/gi,
                                            template: '$1\n\t{{ camelCase epicName }},'
                                        });
                                }
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
                    actions.push({
                        type: 'modify',
                        path: storeDirectory + 'sagas.ts',
                        pattern: /(export\s*default\s*function\*\s*rootSaga)/,
                        templateFile: 'templates/saga.tpl',
                    });

                    actions.push({
                        type: 'modify',
                        path: storeDirectory + 'sagas.ts',
                        pattern: /(export\s*default\s*function\*\s*rootSaga\s*\(\s*\)\s*\{\s*yield\s*all\s*\(\s*\[\s*)/,
                        template: '$1\t{{camelCase sagaName}}()\n\t',
                    });
                }

                return actions;
            }
        });
    }
};
