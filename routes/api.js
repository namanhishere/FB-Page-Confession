var express = require('express');
var router = express.Router();
const {getAllConfess} = require("../function/confess-load")
const {isThisLocalhost }  = require("../function/localCheck")
var admin = require("firebase-admin");
const db = admin.firestore();
const { v4: uuidv4 } = require('uuid');
const superagent = require("superagent")


async function generateCofessID() {
  let id = uuidv4().split("-")[4]
  console.log(id)
  let confessdoc = await db.collection('Confession').doc(id).get()
  if(confessdoc.exists) return generateCofessID()
  return id
}

/* GET users listing. */
router.get('/generalGetInfo', function(req, res) {
  if(!isThisLocalhost(req)) return res.json({status:false})
  let rules = ["Hãy trở thành 1 người văn minh","Bằng cách sử dụng web, bạn đã đồng ý với vô số đống luật này"]
  let news = "Lộ bằng chứng D đã chia tay HP"
  let status = true
  res.json({rules,news,status})
});

router.get('/adminGetInfo', async function(req, res) {
  console.log(isThisLocalhost(req))
  if(!isThisLocalhost(req)) return res.json({status:false})
  let ConfessionSetting  = await db.collection('General').doc('AppInfo').get()
  let { adminUsername,adminPassword } =  ConfessionSetting.data()
  let confess = []
  let confessRef = (await db.collection('Confession').where("status","==","None").get()).forEach(info =>{
    confess.push(info.data())
  })
  res.json({confess,username:adminUsername,password:adminPassword})
});

router.post('/confessPost', async function(req, res) {
  let status = 0 
  let {content,tag} = req.body
  let ConfessionSetting  = await db.collection('General').doc('ConfessionSetting').get()
  let { badwordList } =  ConfessionSetting.data()
  console.log(content)
  badwordList.forEach(word => {
    if(content.includes(word)){
      status = 1
      return res.json({status:false,alert:{title:"Hình như bạn có nói những từ không văn minh", text:"Để được đăng confession, bạn hãy đảm bảo rằng bạn không nói bậy nhé ", icon:"warning"},info:{}})
    } 
  })
  console.log(status)
  console.log(tag)
  tag.forEach(e =>{
    if(["dogfood", "creepy", "phot", "che"].indexOf(e) == -1) return status=1
  })
  console.log(status)
  if(status == 1 ) return
  let confessID  = await generateCofessID()
  let token = `${confessID}-${uuidv4()}`
  console.log({
    confessID,token,content,tag,status:"None",postID:0
  })
  db.collection("Confession").doc(confessID).set({
    confessID,token,content:content.replaceAll("\n","\\n"),tag,status:"None",postID:0
  })

  res.json({status:false,alert:{title:"Confession của bạn đã được gửi", text:"Trang sẽ xuất hiện thêm một hộp thoại về thông tin, hãy tìm một nơi nào đó để ghi lại nha, bạn sẽ cần nó đó",icon:"success"},info:{confessID,token}})
});


router.post('/confessStatusCheck', async function(req, res) {

    let {id} = req.body
    let ConfessionInfo  = await db.collection('Confession').doc(id).get()
    if(!ConfessionInfo.exists) return res.json({status:"Not Found",id:id,link:""})
    let info = ConfessionInfo.data()
    
    let {confessID,status,postID} = info
    let link = "https://facebook.com/"+postID
    res.json({status,id:confessID,link})

});

router.post('/loadConfessUnCheck', async function(req, res) {
  let {id} = req.body
  let ConfessionInfo  = await db.collection('Confession').doc(id).get()
  if(!ConfessionInfo.exists) return res.json({status:"Not Found",id:id,link:""})
  let info = ConfessionInfo.data()
  
  let {confessID,status,postID} = info
  let link = "https://facebook.com/"+postID
  res.json({status,id:confessID,link})

});

router.post('/adminLogin', async function(req, res) {
  let {username,password} = req.body
  let GeneralConfig  = await db.collection('General').doc("AppInfo").get()
  let {adminUsername,adminPassword} = GeneralConfig.data()
  if(username != adminUsername || password != adminPassword){
    res.json({status:false,alert:{title:"Unauthorized Access",icon:"warning"},info:{}})
  }else{
    res.json({status:true,alert:{title:"Đăng nhập thành công",icon:"success"},info:{redirect:"/admin"}})
  }


});

router.post('/confessStatusUpdate', async function(req, res) {
  
  let {username,password} = req.cookies
  let {id,status} = req.body
  let GeneralConfig  = await db.collection('General').doc("AppInfo").get()
  let {adminUsername,adminPassword,pageID,accessToken,currentConfess} = GeneralConfig.data()
  if(username != adminUsername || password != adminPassword) return res.send("<p>Unauthorized Access</p>")

  let ConfessionInfo  = await db.collection('Confession').doc(id).get()
  if(!ConfessionInfo.exists) return res.json({status:"Not Found",id:id,link:""})
  //Đăng bài Fb
  currentConfess++
  db.collection('General').doc('AppInfo').update({
    currentConfess
  })
  confessData= ConfessionInfo.data()
  let tag_String = ""
  if(confessData.tag.includes("dogfood")) tag_String = tag_String+"🐕‍🦺 Cảnh báo có cơm chó\n"
  if(confessData.tag.includes("creepy")) tag_String = tag_String+"👻 Hơi kinh dị một chút, cân nhắc đọc trước khi ngủ\n"
  if(confessData.tag.includes("phot")) tag_String = tag_String+"🔪 Tràn ngập dramaa\n"
  if(confessData.tag.includes("che")) tag_String = tag_String+"🙈 Cân nhắc nếu bạn không muốn được mất khả năng đọc\n.\n.\n.\n.\n.\n.\n.\n.\n"

  console.log(`#Confession_${currentConfess}\n`+tag_String + confessData.content+"\n\n//Đăng tải confession của bạn tại: http://localhost:3000/")
  if(status == "Accepted"){
    superagent.post("https://graph.facebook.com/"+pageID+"/feed").send({
      message:`#Confession_${currentConfess}\n`+tag_String + confessData.content+`\n\n//Đăng tải confession của bạn tại: http://localhost:3000/`,
      access_token:accessToken
    }).end((er,json) => {
      if(er) return 
      console.log(JSON.parse(json.text))
      db.collection('Confession').doc(id).update({
        postID:JSON.parse(json.text).id
      })
    })
  }
  db.collection('Confession').doc(id).update({
    status
  })
  //cập nhật csdl



});


module.exports = router;
