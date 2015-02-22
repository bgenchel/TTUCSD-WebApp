var app = require('../../app');
var bcrypt = require('bcrypt');

exports.getMembers = function(req, res) {
  app.knex('members')
    .orderBy('id', 'asc')
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    .then(function(rows) {
      console.log(rows.length + ' member(s) returned');
      return res.json(rows);
    });
};

exports.getMember = function(req, res) {
  var member_id = req.params.memberid;
  app.knex('members')
    .where('id', member_id)
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    .then(function(row) {
      // Cannot find member
      if(row.length === 0) {
        return res.status(404).json(row);
      // Found member
      } else {
        return res.status(200).json(row);  
      }
    });
};

exports.getMemberEventsCreated = function(req, res) {
  var member_id = req.params.memberid;
  app.knex('events').where('created_by', member_id)
    .orderBy('created_on', 'desc')
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    .then(function(rows) {
      console.log(rows.length + ' events were created by member with id ' + member_id);
      return res.json(rows);
    });
};

exports.getMemberEventsAttending = function(req, res) {
  var member_id = req.params.memberid;
  var subquery = app.knex('attending')
    .where('member_id', member_id)
    .select('event_id');
    
  app.knex('events').where('id', 'in', subquery)
    .orderBy('created_on', 'desc')
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    .then(function(rows) {
      console.log(rows.length + ' events attending by member with id ' + member_id);
      return res.json(rows);
    });
};

// For login
exports.checkMember = function(req, res) {
  // Get the request body
  var username = req.body.username;
  var password = req.body.password;
  var done = req.body.done;

  app.knex('members').where({
      username: username
    }).select('*')

    .then(function(rows) {
      console.log(rows.length + ' row(s) were received');
      if(rows.length === 0) {
        var msg = [{
          "error": "User does not exist."
        }];
        return res.status(400).json(msg);
      } else {
        // verify the given password with hashed password in db
        var hash = bcrypt.hashSync(password, rows[0].salt);

        // password is correct
        if(hash === rows[0].hashed_password) {
          var msg = [{
            "id": rows[0].id,
            "first_name": rows[0].first_name,
            "username": rows[0].username,
            "message": "Logged in successfully"
          }];
          return res.status(200).json(msg);
        } else { // password is incorrect
          var msg = [{
            "error": "Incorrect user/password combination."
          }];
          return res.status(400).json(msg);
        }
      }
    });
};

// For register
exports.createMember = function(req, res) {
  var member = {};
  
  // Get the request body
  member.active_id = req.body.active_id;
  member.first_name = req.body.first_name;
  member.last_name = req.body.last_name;
  member.username = req.body.username;
  member.password = req.body.password;
  member.email = req.body.email;
  member.phone_number = req.body.phone_number;
  member.start_year = req.body.start_year;
  member.grad_year = req.body.grad_year;
  member.major = req.body.major;
  member.class = req.body.class;
  member.security_question = req.body.security_question;
  member.security_answer = req.body.security_answer;

  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(req.body.password, salt);

  member.hashed_password = hash;
  member.salt = salt;

  // Check if member with active_id or username already exists, then insert
  app.knex('members')
    .select('*')
    .where('active_id', member.active_id)
    .orWhere('username', member.username)
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    .then(function(rows) {
      // Insert since there is no duplicate member
      if( rows.length === 0 ) {
        app.knex
          .insert(member)
          .returning('id')
          .into('members')
          // Server error maybe
          .catch(function(error) {
            console.error(error);
            return res.status(500).json(error);
          })
          .then(function(row) {
            // Respond with the created member's id
            var msg = [{
              "id": row[0],
              "message": "Created new member"
            }];
            // 201 means created a resource
            return res.status(201).json(msg);
          });
      // Return duplicate status code and error message
      } else {
        var msg = [{
          "error": "Duplicate member exists with active_id: " + 
                    member.active_id + " or username: " + member.username
        }];
        return res.status(409).json(msg);
      }
    });
};

exports.updateMember = function(req, res) {
  var member_id = req.params.memberid;
  var member = {};
  
  // Get the body
  member.active_id = req.body.active_id;
  member.first_name = req.body.first_name;
  member.last_name = req.body.last_name;
  member.password = req.body.password;
  member.email = req.body.email;
  member.phone_number = req.body.phone_number;
  member.start_year = req.body.start_year;
  member.grad_year = req.body.grad_year;
  member.major = req.body.major;
  member.class = req.body.class;

  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(req.body.password, salt);

  member.hashed_password = hash;
  member.salt = salt;
  
  // Update appropriate member_id
  app.knex('members')
    .update(member)
    .returning('id')
    .where('id', member_id)
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    // Check if we were able to update the member
    .then(function(rows) {
      if(rows.length === 0) {
        var msg = [{
          "error": "Could not find member to update"
        }];
        return res.status(404).json(msg);
        
      } else {
        var msg2 = [{
          "id": rows[0],
          "message": "Updated existing member"
        }];
        return res.status(200).json(msg2);
      }
    });
};

exports.deleteMember = function(req, res) {
  var member_id = req.params.memberid;

  // Delete member id
  app.knex('members')
    .where('id', member_id)
    .del()
    .returning('id')
    // Server error maybe
    .catch(function(error) {
      console.error(error);
      return res.status(500).json(error);
    })
    // Check if we were able to delete member
    .then(function(rows) {
      if(rows.length === 0) {
        var msg = [{
          "error": "Could not find member to delete"
        }];
        return res.status(404).json(msg);
        
      } else {
        var msg2 = [{
          "id": rows[0],
          "message": "Deleted a member"
        }];
        return res.status(200).json(msg2);
      }
    });
};