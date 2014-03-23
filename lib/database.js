(function(){
  var mongoose, _, Database, Clog;

  mongoose = require('mongoose');
  _        = require('underscore');

  Database = (function(){
    function Database(options){
      var _this = this;
      this.options = options || {
        db: {
          url: 'mongodb://localhost/test'
        }
      }
      this.client = mongoose.createConnection(this.options.db.url);
      this.client.on('error', function(){
        console.log('mongodb connection error');
      });
      this.client.on('open', function(){
        console.log('mongodb ready!');
        _this._init()
      });
    }

    Database.prototype = {
      _init: function(){
        var clogSchema = new mongoose.Schema({
          id: mongoose.Schema.Types.ObjectId,
          timestamp: Date,
          source: String,
          context: String,
          content: String,
          parent: {type: mongoose.Schema.Types.ObjectId, default: null},
          children: {type: [mongoose.Schema.Types.ObjectId], default: []}
        });
        Clog = this.client.model('Clog', clogSchema);
      },

      _result: function(cb){
        var _cb = cb;
        return function(err, result){
          if(err){
            console.log(err)
            throw new Error(err);
          }
          else{
            if(_.isFunction(_cb))
              _cb(result);
          }
        }
      },

      create: function(obj, cb){
        var clog = new Clog(obj);
        clog.id = clog._id;
        clog.save(this._result(cb));
      },

      read: function(id, cb){
        Clog.findById(id, this._result(cb));
      },  

      update: function(id, update, cb){
        Clog.findByIdAndUpdate(id, update, this._result(cb));
      },

      del: function(id, cb){
        Clog.findByIdAndRemove(id, this._result(cb));
      },

      all: function(cb){
        //TODO: must think about this, e.g. about pagination/limit
        Clog.find({}, this._result(cb));
      },

      since: function(timestamp, cb){
        Clog.find({timestamp: { $gte: timestamp }}, this._result(cb));
      }
    }

    return Database;
  })();
  module.exports = Database;
}).call(this);