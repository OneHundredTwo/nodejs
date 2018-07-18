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



//데이터베이스에 연결
function connectDB(){
	//데이터베이스 연결정보 : mongodb://[HOST]:[PORT]/[DB_NAME] : mongodb 시작할때 path이름이 db이름이 되는듯.
	var databaseUrl = 'mongodb://localhost:27017';

	

	//데이터베이스 연결
	MongoClient.connect(databaseUrl, (err, db) => {
		if(err) throw err;

		console.log('데이터베이스에 연결되었습니다 : '+databaseUrl);

		//database 변수에 할당
		//책에서 쓴 버전이 예전거라서 그런건지 중간내용이 빠져서그런건지
		//최근 example에선 
		//client.db(dbName).collection('createIndexExample1'); 
		//이런식으로 쓰라고함.
		database = db.db('local');

		//console.log(database);
	})
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

	//users 컬렉션 참조
	
	var users = database.collection('users');

	//아이디와 비밀번호를 사용해 검색
	//toArray = ResultSet
	users.find({"id":id, "password":password}).toArray((err, docs) => {
		if(err) {callback(err, null); return;};

		if(docs.length > 0){
			console.log('아이디 [%s], 비밀번호가 [%s]가 일치하는 사용자 찾음.', id, password);
			callback(null, docs);
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

	authUser(database, id, password, (err, docs) => {
		if(err) throw err;
		if(docs){
			console.dir(docs);
			var user = docs[0];
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

//join
var addUser = function(database, id, password, name, profile, callback){
	console.log('addUser 호출됨 : '+ id +', '+ password +', '+name);

	//users 컬렉션 참조
	var users = database.collection('users');

	//id, password, username을 사용해 사용자 추가
	users.insertMany([{"id":id, "password":password, "name":name, "profile":profile}], (err, result) => {
		if(err) {
			callback(err, null);
			return;
		}

		//오류가 아닌경우, 콜백함수를 호출하면서 결과 객체 전달
		if(result.insertedCount > 0){
			console.log("사용자 레코드 추가됨 : " + result.insertedCount);
		}else{
			console.log("추가된 레코드 없음");
		}

		callback(null, result);
	})
}
//0717밤에 한참동안 multer로 업로드가 안되는 현상 : 코드 똑같은데 그냥 갑자기 됐다. nodejs도 좀 불안정한듯.
//안되는 현상이 발생하면 그냥 완전히 껏다 키자.
router.route('/user').post(upload.single('profile'),(req, res, next) => {
	var id = req.body.id, password = req.body.password, name = req.body.name, profile = req.file.filename;
	addUser(database, id, password, name, profile, (err, result) => {
		if(err) throw err;

		res.writeHead('200', htmlContentType);
		res.write(headTmpl('회원가입 결과'));
		//content
		if(result.ops.length>0){
			var user = result.ops[0];
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