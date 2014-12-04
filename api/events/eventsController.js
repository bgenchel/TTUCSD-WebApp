var app = require('../../app');

exports.getEvents = function(req, res) {
  app.knex('events')
    .orderBy('id', 'asc')
    .then(function(rows){
      console.log(rows.length + ' event(s) returned');
      return res.json(rows);
    });
};

exports.getEvent = function(req, res) {
  var event_id = req.params.eventid;
  app.knex('events').where('id', event_id)
    .then(function(row){
      console.log(row);
      return res.json(row);
    });
};

exports.getEventComments = function(req, res) {
  var event_id = req.params.eventid;
  app.knex('comments').where('event_id', event_id)
    .orderBy('created_on', 'desc')
    .then(function(rows) {
      console.log(rows.length + ' comment(s) returned for event with id ' + event_id);
      return res.json(rows);
    });
};

exports.getEventAttendees = function(req, res) {
  var event_id = req.params.eventid;
  var subquery = app.knex('attending')
    .where('event_id', event_id)
    .select('member_id');
  app.knex('members').where('id', 'in', subquery)
    .orderBy('first_name', 'asc')
    .then(function(rows) {
      console.log(rows.length + ' people attending event with id ' + event_id);
      return res.json(rows);
    });
};
