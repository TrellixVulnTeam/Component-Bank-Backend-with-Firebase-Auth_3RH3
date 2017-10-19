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


app.post('/register', function (req, res, next) {
    console.log('Hello, World!', req.param('username'));
    var user_id = req.body.username;
    var password = req.body.password;
    Auth.studentAuth(user_id, password, function (name_stud, regno_stud, cookieJ, auth_err) {
      if (auth_err) {
        res.send(JSON.stringify(auth_err));
        console.log('Authentication Failed!');
      }
      else{
        console.log('Successfull Authentication!');
        name = name_stud;
        registrationNumber = regno_stud;
        unirest.get(personal_details)
        .jar(cookieJ)
        .timeout(28000)
        .end(onPersonalDetails);
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

      res.send(JSON.stringify({
        "code" : 0,
        "registrationNumber" : registrationNumber,
        "name" : name,
        "dob" : dob, 
        "gender" : gender, 
        "email" : email_vit, 
        "programme" : programme, 
        "phone" : phone, 
        "otherEmail" : email
      }));
    }
});

