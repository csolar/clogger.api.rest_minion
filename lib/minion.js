(function(){
  var amqp, _, Minion, Database;

  amqp   = require('amqp');
  _      = require('underscore');
  Database     = require('./database');

  Minion = (function(){
    function Minion(options){
      this.options = options || {};
    }

    Minion.prototype = {
      connect: function(cb){
        var _this = this;
        this.database = new Database();
        this.connection = {};
        this.connection.producer = new amqp.createConnection({url: this.options.amqp.url.produce});
        this.connection.consumer = new amqp.createConnection({url: this.options.amqp.url.consume});

        this.connection.producer.on('ready', function(){
          _this.connection.producer.exchange(_this.options.amqp.resexchange, {type: 'direct', durable: true, autoDelete: false}, function(x){
            _this.resx = x;
          });
        });
        this.connection.consumer.on('ready', function(){
          _this.connection.consumer.exchange(_this.options.amqp.reqexchange, {type: 'direct', durable: true, autoDelete: false}, function(x){
            _this.connection.consumer.queue('persister', {exclusive: false}, function(q){
              _(['clog', 'clogs', 'reply', 'merge', 'unclog', 'create']).each(function(req){
                q.bind(x, 'api.' + req);
              });
              q.subscribe(function(payload, headers, info){
                var key = payload.key;
                _this[info.type].call(_this, payload, function(result){
                  _this.resx.publish(key, result);
                });
              });
              if(_.isFunction(cb)){
                cb.call(_this);
              }
            });
          });
        });
      },

      clog: function(params, cb){
        this.database.read(params.id, cb);
      },
      unclog: function(params, cb){
        this.database.del(params.id, cb);
      },
      clogs: function(params, cb){
        if(params.since)
          this.database.since(params.since, cb);
        else
          this.database.all(cb);
      },
      create: function(params, cb){
        var clog = params.clog;
        this.database.create(clog, cb);
      },
      reply: function(params, cb){
        this.create(params, cb);
      },
      merge: function(params, cb){
        var id = params.id,
            update = params.update,
            _this = this;

        this.database.read(id, function(target){
          _this.database.update(id, {$set: {children: _.union(target.children, update.children)}}, cb);
        });
      },
      close: function(){
        var _this = this;
        _([this.connection.producer, this.connection.consumer]).each(function(connection){
          //from: https://github.com/rabbitmq/rabbitmq-tutorials/blob/master/javascript-nodejs/amqp-hacks.js
          connection.queue('tmp-' + Math.random(), {exclusive: true}, function(){
            connection.end();
            // `connection.end` in 0.1.3 raises a ECONNRESET error, silence it:
            connection.once('error', function(e){
              if (e.code !== 'ECONNRESET' || e.syscall !== 'write')
                throw e;
            });
          });
        });
      }
    }
    return Minion;
  })();
  module.exports = Minion;
}).call(this);