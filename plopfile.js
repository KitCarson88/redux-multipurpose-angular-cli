const glob = require('glob-promise');
const fs = require('fs');
const { cwd } = require('process');

const SRC_DIR = 'src';
const NG_MODULE = '@NgModule';
const IMPORTS = 'imports';
const STORE_MODULE = 'StoreModule';

//If store module doesn't exists return false
//If store module exists in the right folder returns true
//If store module exists in a wrong folder exits the app
function verifyStoreModule()
{
  var dirs = glob.sync(SRC_DIR + '/**/*');

  for (var i = 0; i < dirs.length; ++i)
    if (dirs[i].indexOf("store.module") >= 0)
    {
      if (dirs[i].indexOf("store/store.module") < 0)
      {
        console.log("The store module is not well configured. Please delete it and restart the cli");
        process.exit(-1);
      }

      return true;
    }

  return false;
}

function addImportToAppModule(path)
{
    var dirs = glob.sync(SRC_DIR + '/**/*');

    var subpath;
    for (var i = 0; i < dirs.length; ++i)
        if (dirs[i].indexOf("app.module") >= 0)
            subpath = dirs[i];

    if (subpath)
    {
        var appModule = fs.readFileSync(path + '/' + subpath).toString();

        const appModuleLines = appModule.split(/\r?\n/);
        
        var ngModuleLineIndex, importsLineIndex, storeModuleLineIndex;

        for (var i = 0; i < appModuleLines; ++i)
            if (appModuleLines[i].indexOf(NG_MODULE) >= 0)
                ngModuleLineIndex = i;
            else if (appModuleLines[i].indexOf(IMPORTS) >= 0)
                importsLineIndex = i;
            else if (appModuleLines[i].indexOf(STORE_MODULE) >= 0)
                storeModuleLineIndex = i;

        if (ngModuleLineIndex && importsLineIndex && importsLineIndex > ngModuleLineIndex)

    }
}

module.exports = function (plop)
{
    //Verify if store module exists and it's contained under src/store path
    plop.addHelper('cwd', (p) => process.cwd());

    if (!verifyStoreModule())
    {
        console.log('\nNo store.module found. Let\'s initialize a new one\n');

        plop.setGenerator('Create store generator', {
            prompts: [{
                type: 'input',
                name: 'storeDir',
                message: 'In which directory do you want to create the store folder?',
                default: SRC_DIR
            }, {
                type: 'confirm',
                name: 'enableEpics',
                message: 'Do you want to initialize redux observable epics skeleton?'
            }, {
                type: 'confirm',
                name: 'enableSagas',
                message: 'Do you want to initialize redux sagas?'
            }, {
                type: 'confirm',
                name: 'enablePersistence',
                message: 'Do you want to enable redux-persist persistence?'
            }, {
                type: 'input',
                name: 'routerKey',
                message: 'Do you want to enable angular router reducer? Leave it blank if you don\'t need it; otherwise digit a key name to the reducer (e.g. router)'
            }, {
                type: 'confirm',
                name: 'enableLogger',
                message: 'Do you want to enable redux logger?'
            }],
            actions: function(data) {
                var actions = [];
    
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
    
                return actions;
            }
        });
    }
};
