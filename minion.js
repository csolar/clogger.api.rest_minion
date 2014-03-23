var Minion = require('./lib/minion'),
    config = require('./config'),
    minion = new Minion(config);

minion.connect();
