var express = require('express');
var router = express.Router();
const superagent = require("superagent")

/* GET home page. */
router.get('/', function(req, res, next) {
  superagent.get("localhost:3000/api/generalGetInfo").end((er,json) => {
    console.log(json.body)
    if (json.body.status) {
      res.render("mainpage", json.body);
    }else{
      res.render("stop", json.body);
    }
  })
  
});

router.get('/reply', function(req, res, next) {
  superagent.get("localhost:3000/api/generalGetInfo").end((er,json) => {
    console.log(json.body)
    if (json.body.status) {
      res.render("reply", json.body);
    }else{
      res.render("stop", json.body);
    }
  })
  
});

router.get('/status', function(req, res, next) {
  superagent.get("localhost:3000/api/generalGetInfo").end((er,json) => {
    console.log(json.body)
    if (json.body.status) {
      res.render("status", json.body);
    }else{
      res.render("stop", json.body);
    }
  })
  
});


router.get('/admin', function(req, res, next) {
  superagent.get("localhost:3000/api/adminGetInfo").end((er,json) => {
    console.log(json.body)
    if(json.body.username !== req.cookies.username || json.body.password !== req.cookies.password ) return res.send("<p>Unauthorized Access</p>")
    res.render("admin", json.body);
  })
});
router.get('/admin-login', function(req, res, next) {
  res.render("login")
})
module.exports = router;
