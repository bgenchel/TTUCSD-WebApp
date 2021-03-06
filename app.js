var express = require('express');
var app = express();

// Module dependencies
var connect = require('connect');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var http = require('http');
var path = require('path');
var handlebars = require('express-handlebars');
var morgan  = require('morgan');
var dotenv = require('dotenv');

// Dependencies for signin/authentication system
var passport = exports.passport =  require('passport');
var LocalStrategy = exports.LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

// Route variables
var auth = require('./routes/auth');
var admin = require('./routes/admin');
var dashboard = require('./routes/dashboard');
var event = require('./routes/event');

// Make requests to our API
var request = require('superagent');

// Other variables
var port = process.env.PORT || 2014;

// Connect to the PostgreSQL database, whether locally or on Heroku
// MAKE SURE TO CHANGE THE NAME FROM 'ttapp' TO ... IN OTHER PROJECTS
// PostgreSQL
dotenv.load();
var pg = require('pg');
var conString = process.env.DB_CREDENTIALS;
var knex = exports.knex = require('knex')({
  client: 'pg',
  connection: conString
});

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
},
  function(username, password, done) {
    request.post('http://localhost:' + port + '/api/members/login')
      .send({ 'username': username, 'password': password })
      .end(function(err, resp) {
        if(err) {
          return done(null, false, { error: 'Error logging in.'});
        }

        resp = JSON.parse(JSON.stringify(resp.body));
        if(resp.length === 0 || resp[0].error) {
          return done(null, false, { error: 'Incorrect user/password combination.' });
        } else {
          return done(null, {
            'id': resp[0].id,
            'first_name': resp[0].first_name,
            'username': resp[0].username
          });
        }
      });
  }
));

// Serialize the user session by id
passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

// Deserialize the user session by id
passport.deserializeUser(function(id, done) {
  knex('members').where({
        id: id,
      }).select('*')

      .then(function(rows) {
        return done(null, rows[0].first_name);
      });
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

// all environments
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cookieParser('Theta Tau secret key'));
app.use(morgan('dev'));
app.use(session( {
  secret: 'Theta Tau',
  name: 'sid',
  cookie: { path: '/', httpOnly: true, secure: false, maxAge: null },
  saveUninitialized: true,
  resave: true
}));
//app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public', { redirect : false }));

// Add routes here
app.get('/', auth.loginView);
app.get('/login', auth.loginView);
app.get('/logout', ensureAuthenticated, auth.logoutView);
app.get('/admin', ensureAuthenticated, admin.adminViewHome);
app.get('/admin/add', ensureAuthenticated, admin.adminViewAdd);
app.get('/admin/update/:id', ensureAuthenticated, admin.adminViewUpdate);
app.get('/dashboard', ensureAuthenticated, dashboard.dashboardView);
app.get('/partials/:name', ensureAuthenticated, dashboard.partials);

app.post('/login',
  passport.authenticate('local', { successRedirect: '/dashboard',
                                   failureRedirect: '/login',
                                  failureFlash: true })
);

app.post('/admin/add', admin.addMember);
app.post('/admin/update/:id', admin.updateMember);
app.post('/event/add', event.addEvent);

// Routes for api
var membersRouter = require(__dirname + '/api/members/membersRouter');
app.use('/api/members', membersRouter);

var eventsRouter = require(__dirname + '/api/events/eventsRouter');
app.use('/api/events', eventsRouter);

var commentsRouter = require(__dirname + '/api/comments/commentsRouter');
app.use('/api/comments', commentsRouter);

var attendingRouter = require(__dirname + '/api/attending/attendingRouter');
app.use('/api/attending', attendingRouter);

// If none of our routes are matched, we go to dashboard
app.get('*', ensureAuthenticated, dashboard.dashboardView);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
