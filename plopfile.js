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
    if (!verifyStoreModule())
    {
        plop.addHelper('cwd', (p) => process.cwd());
    
        plop.setGenerator('test', {
            prompts: [{
                type: 'confirm',
                name: 'wantTacos',
                message: 'Do you want tacos?'
            }],
            actions: function(data) {
                var actions = [];
    
                if(data.wantTacos) {
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/folder/{{dashCase name}}.txt',
                        templateFile: 'templates/tacos.txt'
                    });
                } else {
                    actions.push({
                        type: 'add',
                        path: '{{cwd}}/folder/{{dashCase name}}.txt',
                        templateFile: 'templates/burritos.txt'
                    });
                }
    
                return actions;
            }
        });
    }
};
