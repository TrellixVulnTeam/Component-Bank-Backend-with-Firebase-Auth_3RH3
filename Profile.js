var Auth = require('vitauth');
var express = require('express');
var tabletojson = require('tabletojson');
var unirest = require('unirest');
var app = express();
var port = process.env.PORT || '3001';

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.listen(port);

var name, registrationNumber, block_name, room_no, dob, gender, email_vit, programme, phone, email;
const personal_details = 'https://vtop.vit.ac.in/student/profile_personal_view.asp';
const image_url = "https://vtop.vit.ac.in/student/view_photo_2.asp?rgno=";

// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://techloop:techloop@ds125365.mlab.com:25365/techloop'); // connect to database
var User   = require('./user'); // get our mongoose model

var admin = require("firebase-admin");
var serviceAccount = require("./firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eeeeeeq-6b9c5.firebaseio.com"
});

app.post('/register', function (req, res, next) {
    console.log('Hello, World!', req.param('username'));
    var user_id = req.body.username;
    var password = req.body.password;
    User.findOne({username : user_id}, function(err, users) {
      if (err) throw err;
      if (users == null) {
        Auth.studentAuth(user_id, password, function (name_stud, regno_stud, cookieJ, auth_err) {
          if (auth_err) {
            res.json({"code" : 1, "message" : "Invalid Credentials or VIT server not running!"});
            //res.send(JSON.stringify(auth_err));
            console.log('Authentication Failed!');
          }
          else{
            console.log('Successfull Authentication!');
            name = name_stud;
            registrationNumber = regno_stud;

            // const usersRef = ref.child('users/');
            // usersRef.set({
            //   registrationNumber : {
            //     "firstName" : name,
            //     "lastName" : ""
            //     "place" : room_no
            //   }
            // });

            unirest.get(personal_details)
            .jar(cookieJ)
            .timeout(28000)
            .end(onPersonalDetails);
          }
        });
      } 
      else if (users) {
        console.log(users);
        res.json({ code: 1, message: 'User Already Signed Up!' });
      }
    });

    function onPersonalDetails(response) {
      var PersonalJsonTable = tabletojson.convert(response.body);
      dob = PersonalJsonTable[3][2]['1'];
      gender = PersonalJsonTable[3][3]['1'];
      email_vit = PersonalJsonTable[3][7]['1'];
      programme = PersonalJsonTable[3][17]['1'];
      phone = PersonalJsonTable[3][26]['1'];
      email = PersonalJsonTable[3][27]['1'];

      // create a sample user
      var nick = new User({ 
        username: req.body.username, 
        password: req.body.password,
        admin: true,
        regNumber : registrationNumber,
        name : name,
        dob : dob, 
        gender : gender, 
        email : email_vit, 
        programme : programme, 
        phone : phone, 
        otherEmail : email 
      });
  
      // save the sample user
      nick.save(function(err) {
        if (err) throw err;
        console.log('User saved successfully');
        res.json({ code: 0, details:{
          "registrationNumber" : registrationNumber,
          "name" : name,
          "dob" : dob, 
          "gender" : gender, 
          "email" : email_vit, 
          "programme" : programme, 
          "phone" : phone, 
          "otherEmail" : email
        }});
      });
    }
});

app.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

var jwt = require('jsonwebtoken');

app.post('/authenticate', function(req, res) {
    // find the user
    User.findOne({username : req.body.username}, function(err, users) {
      if (err) throw err;
      if (users == null) {
        res.json({ code: 1, message: 'Authentication failed. User not found.' });
      } 
      else if (users) {
        // check if password matches
        if (users.password != req.body.password) {
          res.json({ code: 1, message: 'Authentication failed. Wrong password.' });
        } 
        else {
          // if we using firebase admin SDK to create the real time database
          var uid = users.regNumber;
          admin.auth().createCustomToken(uid)
          .then(function(customToken) {
            // Send token back to client
            res.json({
              code: 0,
              message: 'Enjoy your token!',
              token: customToken
            });
          })
          .catch(function(error) {
            res.json({
              code: 1,
              error : error
            });
            console.log("Error creating custom token:", error);
          });

          // if we are not using firebase admin sdk for creating realtime database
          // // if user is found and password is right
          // // create a token with only our given payload
          // // we don't want to pass in the entire user since that has the password
          // const payload = {
          //   admin: users.admin,
          //   registrationNumber : users.regNumber
          // };
          // var token = jwt.sign(payload, '84u3nr8u3n4u2093d039umr2u2m03r', {
          //   expiresIn: 1440 // expires in 24 hours
          // });
          // //return the information including token as JSON
          // res.json({
          //   code: 0,
          //   message: 'Enjoy your token!',
          //   token: token
          // });

        }   
      }
  
    });
});