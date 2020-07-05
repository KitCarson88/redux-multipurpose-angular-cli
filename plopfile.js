module.exports = function (plop) {
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
};
