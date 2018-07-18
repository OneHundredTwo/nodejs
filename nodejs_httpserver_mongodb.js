var fs = require('fs');

var express = require('express'),
	http = require('http'),
	path = require('path');

var bodyParser = require('body-parser'),
	expressSession = require('express-session'),
	cookieParser = require('cookie-parser'),
	static = require('serve-static'),
	errorHandler = require('errorHandler'),
	cors = require('cors');
var router = express.Router();
var multer = require('multer');

var expressErrorHandler = require('express-error-handler');

//몽고디비 모듈 사용
var MongoClient = require('mongodb').MongoClient;
//데이터베이스 객체를 위한 변수 선언
var database;

//MongoDB = NoSQL : No Schema => 이것만으로 데이터를 모아서보거나 하긴 어려움
//Mongoose : MongoDB Collection에 구조(스키마)를 찾아 관리할 수 있도록 하는 ObejctMapper모듈. 스키마를 만들고 모델을 만든다.
//ObjectMapper : 자바스크립트 객체오 ㅏ데이터베이스 객체를 서로 매칭하여 바꿔주는 역할을 하는 녀석들의 총칭.
var mongoose = require('mongoose');

var UserSchema;
var UserModel;

//데이터베이스에 연결
function connectDB(){
	//데이터베이스 연결정보 : mongodb://[HOST]:[PORT]/[DB_NAME] : mongodb 시작할때 path이름이 db이름이 되는듯.
	var databaseUrl = 'mongodb://localhost:27017/local';

	//mongoose를 이용해 데이터베이스에 연결
	mongoose.Promise = global.Promise;
	mongoose.connect(databaseUrl);
	database = mongoose.connection;

	database.on('error', console.error.bind(console, 'mongoose connection error'));
	database.on('open', () => {
		console.log('데이터베이스에 연결되었습니다. : '+databaseUrl);
		//스키마 정의
		//String, Number, Boolean, Array, Buffer, Date, ObjectId, Mixed
		//제약조건 : unique&required : 기본키 제약조건, required : Not Null
		//제약조건을 걸어놓은 스키마로 모델을 생성하면 => collection을 연결할때 무결성검사를 하기때문에 제약조건에 걸리면 에러뿜고 서버가 다운됨.
		//뭐 이딴... 
		UserSchema = mongoose.Schema({
			id:{type:String, required:true, unique:true},
			name:String,
			password:{type:String, required:true},
			profile:{type:String, default:'default.png'},
			created_at:Date,
			updated_at:Date
		});
		console.log('UserSchema 정의함');

		//User Model 정의 
		//Model = Connection처럼 쓴다.
		//model을 정의합니다. name,[schema], [collection], [skipInit]. collection이 지정되지 않으면, name으로 유추한 컬렉션을 사용합니다.
		UserModel = mongoose.model('users', UserSchema);
		console.log('UserModel 정의함.');

	});
	database.on('disconnected', () => {
		console.log('연결이 끊어졌습니다. 5 초후 다시 연결합니다');
		setInterval(connectDB, 5000);
	});

}

//uuid 생성 함수
function uuid() {
    function s4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
var storage = multer.diskStorage({
	destination: function(req, file, callback){
		callback(null, 'uploads');
	},
	filename: function(req,file, callback){
		var parsedFilename = file.originalname.split('.');
		var ext= '';
		if(parsedFilename[parsedFilename.length-1]){
			ext = '.'+parsedFilename[parsedFilename.length-1];
		}
		callback(null, uuid()+ext);
	}
});
var upload = multer({
	storage: storage,
	limits: {
		files: 1,
		fileSize: 1024*1024*10
	}
});

var app= express();

app.set('port', process.env.PORT||'3000');

app.use('/public', static(path.join(__dirname,'/public')));
//upload한 프로필사진
app.use('/uploads', static(path.join(__dirname,'/uploads')));


//post message body parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//cookie and session
app.use(cookieParser());
app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));

//support ajax
app.use(cors());

var htmlContentType = {'Content-Type':'text/html;charset=utf-8'};
var jsonContentType = {'Content-Type':'application/json;charset=utf-8'};
function getHtmlResponseFunction(url){
	return function(req,res,next){
		fs.readFile(path.join(__dirname,url),'utf-8',(err, data) => {
			res.writeHead('200',{'Content-Type':'text/html;charset=utf-8'})
			res.end(data);
			next();
		});
	};
}

router.route('/').get((req,res,next) => {
	//view템플릿 배우기전엔 임시
	

});

//GET : response view
router.route('/board/write').get(getHtmlResponseFunction('/view/writeForm.html'));
router.route('/login').get(getHtmlResponseFunction('/view/loginForm.html'));
router.route('/join').get(getHtmlResponseFunction('/view/joinForm.html'));

//login
var authUser = function(database, id, password, callback){
	console.log('authUser 호출됨');

	//아이디와 비밀번호를 사용해 검색
	//toArray = ResultSet
	UserModel.find({"id":id, "password":password}, (err,results) => {
		if(err){callback(err, null); return;}

		console.log('아이디 [%s], 비밀번호가 [%s]가 일치하는 사용자 검색 결과', id, password);
		console.dir(results);

		if(results.length > 0 ){
			console.log('일치하는 사용자 찾음.');
			callback(null, results);
		}else{
			console.log('일치하는 사용자 찾지 못함');
			callback(null, null);
		}
	});
}
router.route('/session').post((req, res, next) => {
	//param은 함수 : 인수이름을 넣으면 값이 반환됨. => get이든 post든
	//body-parser가 넣어주는 객체는 body 
	//get으로 넘어오면 query객체에 
	//token형식으로 넘어오면 params 객체에
	var id = req.body.id;
	var password = req.body.password;

	authUser(database, id, password, (err, users) => {
		if(err) {
			console.log("hi im auth error");
			console.log(err); return; res.end()
			;};
		if(users){
			console.log("=======users=======");
			console.dir(users);
			var user = users[0];
			console.log("=======user=======");
			console.dir(user);
			//users는 model 배열, user는 model, user._doc이 결과적으로 user정보
			//근데 user.name이 왜 되는거지...
			res.writeHead('200', htmlContentType);
			res.write(headTmpl('환영합니다'));
			res.write(`<h1>${user.name}님 환영합니다.</h1>
				<img src="/uploads/${user.profile!=null?user.profile:'default.png'}" width="300" height="350"/>
				`);
			res.write(tailTmpl());
			res.end();
			next();
		}else{
			res.redirect('/login');
			res.end();
			next();
		}
	});
});

//join : id auth
var authId = function(database, id, callback){
	console.log('authId 호출됨');

	UserModel.find({"id":id}, (err,results) => {
		if(err){callback(err, null); return;}

		if(results.length > 0 ){
			callback(null, true);
		}else{
			callback(null, false);
		}
	});
}
router.route('/ajax/auth/:id').get((req, res, next) => {
	var id = req.params.id;
	console.log(id);
	var returnValue = {
		isDuplicated:false
	};

	authId(database, id, (err, isDuplicated) => {
		returnValue.isDuplicated = isDuplicated;
		console.log(returnValue);
		//https://stackoverflow.com/questions/19696240/proper-way-to-return-json-using-node-or-express
		//json 형태로 보내는법  1 : JSON.stringify() 
		//방법 2 : express response객체의 send 메소드.
		res.send(returnValue);
		/*res.writeHead('200', jsonContentType);
		res.write(JSON.stringify(returnValue));
		res.end();*/
		next();
	});



})

//join
var addUser = function(database, id, password, name, profile, callback){
	console.log('addUser 호출됨 : '+ id +', '+ password +', '+name);

	//UserModel 인스턴스 생성
	//Model = VO + Connection같네 
	var user = new UserModel({"id":id, "password":password, "name":name, "profile":profile});

	//save()로 저장
	user.save((err) => {
		if(err){callback(err, null); return;}

		console.log("사용자 데이터 추가함.");
		console.log(user);
		callback(null, user);
	})
}
//0717밤에 한참동안 multer로 업로드가 안되는 현상 : 코드 똑같은데 그냥 갑자기 됐다. nodejs도 좀 불안정한듯.
//안되는 현상이 발생하면 그냥 완전히 껏다 키자.
router.route('/user').post(upload.single('profile'),(req, res, next) => {
	console.log("1");
	var id = req.body.id, password = req.body.password, name = req.body.name;
	var profile=null;
	if(req.file){
		profile= req.file.filename;
	}
	console.log("2");
	addUser(database, id, password, name, profile, (err, result) => {
		if(err) {
			console.log("hi im save error");
			console.log(err); return; res.end();
		};

		res.writeHead('200', htmlContentType);
		res.write(headTmpl('회원가입 결과'));
		//content
		if(result){
			var user = result;
			res.write(`
					<h2>회원가입 결과</h2>
					<p>
						<h3>성공!</h3>
						<div>id : ${user.id}</div>
						<div>name : ${user.name}</div>
						<div><img src="/uploads/${user.profile}" width="200" height="250"/></div>
					</p>
					<a href="/login">로그인화면으로</a>
			`);
		}else{
			res.write(`
					<h2>회원가입 결과</h2>
					<p>
						<h3>회원가입에 실패했습니다 다시 시도해주세요!</h3>
						<a href="/join">회원가입 페이지로</a>
					</p>
				
			`);
		}
		res.write(tailTmpl());
		res.end();
		next();
	});
	
});

app.use('/',router);

//error page handler
var errorHandler = expressErrorHandler({
	static:{
		'404':'./error/404.html'
	}
});

//warnning 1 : 문서를 파싱하면서 잘못된 리소스를 요청하면 404에러페이지가 응답되면서, 200ok에 요청한 리소스는 error페이지를 받는다. 
//페이지에러하고 분리해서 생각해야할거 같은데.
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//post middleware
app.use((req,res) => {
	console.log('Post Process : Dynamic resource request process done.');
});


http.createServer(app).listen(3000, () => { 
	console.log('HTTP server started');
	//서버가 시작되면 데이터베이스 연결
	connectDB();
});

var headTmpl=function(title){
	return `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="utf-8">
					<title>${title}</title>
				</head>
				<body>
				`;
}
var tailTmpl= function(){
	return `</body>
			</html>
				`;
}