(function(){
  exports.amqp = {
    url: 'amqp://guest:guest@localhost:5672',
    testurl: 'amqp://guest:guest@localhost:5672',
    reqexchange: 'clogger.api.x.req',
    resexchange: 'clogger.api.x.res',
    reqqueue: 'clogger.api.q.req',
    resqueue: 'clogger.api.q.res',
    timeout: 10000
  };
}).call(this);