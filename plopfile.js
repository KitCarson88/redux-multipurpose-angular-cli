const glob = require('glob-promise');
const fs = require('fs');
const { cwd } = require('process');

const SRC_DIR = 'src';
const NG_MODULE = '@NgModule';
const IMPORTS = 'imports';
const STORE_MODULE = 'StoreModule';

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

//If store module doesn't exists return false
//If store module exists in the right folder returns true
//If store module exists in a wrong folder exits the app
function verifyStoreModule()
{
    var dirs = glob.sync(SRC_DIR + '/**/*');

    for (var i = 0; i < dirs.length; ++i)
    {
        var filePath = getSrcFileRelativePath('store.module');
        console.log("filePath: ", filePath);
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

                if (data.enableEpics)
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/' + data.storeDir + '/store/epics.ts',
                        templateFile: 'templates/epics.tpl'
                    });

                if (data.enableSagas)
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/' + data.storeDir + '/store/sagas.ts',
                        templateFile: 'templates/sagas.tpl'
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
        plop.setGenerator('configureStore', {
            prompts: [{
                type: 'confirm',
                name: 'test',
                message: 'Test?',
            }, {
                type: 'confirm',
                name: 'test2',
                message: 'Test 2?',
            }],
            actions: function(data) {
                var actions = [];

                return actions;
            }
        });
    }
};
