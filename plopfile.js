const glob = require('glob-promise');

//If store module doesn't exists return false
//If store module exists in the right folder returns true
//If store module exists in a wrong folder exits the app
function verifyStoreModule()
{
  var dirs = glob.sync('src/**/*');

  for (var i = 0; i < dirs.length; ++i)
  {
    if (dirs[i].indexOf("store.module") >= 0)
    {
      if (dirs[i].indexOf("store/store.module") < 0)
      {
        console.log("The store module is not well configured. Please delete it and restart the cli");
        process.exit(-1);
      }

      return true;
    }
  }

  return false;
}

module.exports = function (plop)
{
    //Verify if store module exists and it's contained under src/store path
    plop.addHelper('cwd', (p) => process.cwd());

    if (!verifyStoreModule())
    {
        plop.setGenerator('Create store generator', {
            prompts: [{
                type: 'confirm',
                name: 'createStore',
                message: 'No store.module found. Do you want initialize a new one?'
            },{
                type: 'confirm',
                name: 'enableEpics',
                message: 'Do you want to initialize redux observable epics skeleton?'
            },{
                type: 'confirm',
                name: 'enableSagas',
                message: 'Do you want to initialize redux sagas?'
            }],
            actions: function(data) {
                var actions = [];
    
                if(data.createStore)
                {
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/src/store/store.module.ts',
                        templateFile: 'templates/store.module.tpl'
                    });

                    if (data.enableEpics)
                        actions.push({
                            type: 'add',
                            path: '{{cwd}}/src/store/epics.ts',
                            templateFile: 'templates/epics.tpl'
                        });

                    if (data.enableSagas)
                        actions.push({
                            type: 'add',
                            path: '{{cwd}}/src/store/sagas.ts',
                            templateFile: 'templates/sagas.tpl'
                        });
                }
                else
                {
                    console.log("Thanks for using Redux Multipurpose Cli");
                    process.exit(0);
                }
    
                return actions;
            }
        });
    }
};
