//Express 기본 모듈 불러오기
var express = require('express'),
    http = require('http'),
    path = require('path');
//Express 오류 핸들러 모듈 
var expressErrorHandler = require('express-error-handler');
//Express 미들웨어 불러오기
var bodyParser = require('body-parser'),
    static = require('serve-static'),
    errorHandler = require('errorhandler'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session');
//파일 업로드용 미들웨어 //미들웨어? 그냥 모듈이라고하는게 낫지 않나?
var multer = require('multer');
//파일업로드를 위한 기본모듈
var fs = require('fs');

//클라이언트에서 ajax로 요청했을때 CORS(다중 서버 접속) 지원
var cors = require('cors');



//익스프레스 객체 생성
var app = express();

//기본 속성 설정
app.set('port', process.env.PORT || 3000);

//custom middleware
app.use((req, res, next) => {
    console.log('haha custom middle ware : 난 첫번째 미들웨어! 요청된 url을 뿌리지! static도 소용없어!');
    console.log('client request url : ' + req.url);

    next();
})


//public 디렉토리를 static 리소스들의 루트경로로, upload 디렉토리를 업로드되는 리소스들의 루트경로로 접근가능하도록 오픈
app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));

//custom middleware
app.use((req, res, next) => {
    console.log('haha custom middle ware : 난 static 리소스를 요청했을땐 수행되지 않는다!!!');

    next();
})

//body-parser : post요청시 request body에 딸려오는 메세지를 request객체의 params객체에 자동으로 할당해주는 역할
//body-parser를 사용해 application/x-www-form-urlencoded 요청메세지(POST/form) 파싱
app.use(bodyParser.urlencoded({ extended: false }));
//body-parser를 사용해 applicatio/json 메세지 파싱
app.use(bodyParser.json());



//cookie-parser 설정 , 아직도 미들웨어로 얘네를 왜 추가해야하는건지 모르겠다. 왜 미들웨어인지도 모르겠다.
app.use(cookieParser());

//세션 설정
app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));

//클라이언트에서 ajax로 요청했을때 CORS(다중 서버 접속) 지원
app.use(cors());

//uuid 생성 함수
function uuid() {
    function s4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

//multer 미들웨어 사용 : 미들웨서 아요순서 중요 body-parser(POST요청 파라미터를 param객체에 자동할당) -> multer -> router
//파일제한 : 10개, 최대용량 1G 
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, 'uploads'); //위에서 설정한 업로드 파일들 루트 경로 uploads 
    },
    filename: function(req, file, callback) {
        var parsedFilename = file.originalname.split('.');
        var ext = '';
        if (parsedFilename[parsedFilename.length - 1]) {
            ext = '.' + parsedFilename[parsedFilename.length - 1];
        }
        callback(null, uuid() + ext);
    }
});

//미들웨어의 정의는 무엇인가? url 필터? 요청 전처리기? 후처리기? 
//app.use로 등록할 수 있는 함수? 모듈? 
// url에 따라 요청/응답을 처리하는 모든 개체들의 총칭

//이 멀터가 app의 미들웨어로 use되는 시점은? 
//1. multer객체가 생성될때
//2. multer가 매핑된 router에서 호출될때(라이브러리처럼 쓰인다면)
//3. multer 모듈을 require할때

//정답 : 생성된 multer 객체의 함수를 실행할때. ==> 여기선 upload.array()
//함수를 생성해서 반환된 객체를 라우팅함수에 파라미터로 넘겨줍니다.
//라우팅 함수에 파라미터로 넘겨준다 : 그 url패턴에 해당하는 미들웨어를 추가한다.
var upload = multer({
    storage: storage,
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024
    }
});

// router : get/post/put/delete 등 서버자원을 조작하는 RESTful API 형식의 url을 함수에 매핑하는 특수한 미들웨어
// 따라서 맨 마지막에 use로 추가한다.
// router에서 route하는 함수 하나하나들은 그 url 패턴을 처리하는 미들웨어이다.

// 라우터 사용하여 라우팅 함수 등록
var router = express.Router();


//route 경로 : regex 적용됨
router.route('/').get((req, res, next) => {
    console.log(req.query.name);
    fs.readFile(path.join(__dirname, '/public/html/index.html'), 'utf-8', (err, data) => {
        res.writeHead('200', { 'Contetn-Type': 'text/html;charset=utf8' });
        res.write(data);
        res.end();
    });
    next();
})

// /porcess/photo 에서 받아서 처리하는 multipart-form/data에 file입력필드의 name이 photo인경우
// photo를 처리하는 미들웨어를 생성하는 multer객체의 함수를 호출해서 req를 다루는 미들웨어를 추가하기 전에 할당한다.
// array로 생성된 멀터 미들웨어에서 처리된 photo의 value는 req.files에 할당된다.
// (single로 생성됐을경우 req.file에 할당됨.)
// array(filedname[, maxcount]) => maxcount 이상으로 파일이 업로드되는경우 에러가 발생할 수 있다.
// fileds(fields) => 여러 필드의 file 입력이 있을경우 [{fieldname[, maxcount]}]식으로 지정한다. files에 저장된다.
// 갯수제한이 없을경우 maxcount속성을 입력하지 않는다.
router.route('/process/photo').post(upload.array('photo'), (req, res, next) => {
    console.log('/process/photo 호출됨');

    try {
        var files = req.files; //post의 첫번째 인자인 multer.array가(파일이름목록) req의 files에 할당된다고함.

        //file객체 하나에 filedname속성이 있어서, 여러 field로 업로드된 파일들이 들어왔을땐 filename속성으로 구분한다.
        for (var i in files) {
            console.dir('#====== 업로드된 ' + (parseInt(i) + 1) + '번째 파일 정보 ======#');
            console.dir(req.files[i]);
            console.dir('#=====================================#');
        }
        //현재의 파일정보를 저장할 변수 선언
        var originalname = '',
            filename = '',
            mimetype = '',
            size = 0;

        //클라이언트 응답 전송
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h3> 파일업로드 성공 </h3><hr/>');

        if (Array.isArray(files)) {
            console.log("배열에 들어있는 파일 갯수 : %d ", files.length);

            for (var i in files) {
                originalname = files[i].originalname;
                filename = files[i].filename;
                mimetype = files[i].mimetype;
                size = files[i].size;


                console.log('현재 파일정보 : ' + originalname + "\n filename : " + filename + "\n mimetype : " + mimetype + "\n size : " + size);
                res.write('<p>원본 파일이름 : ' + originalname + ' -&gt; 저장파일 명 : ' + filename + '</p>');
                res.write('<p>파일 크기  : ' + size + '</p>');
            }
        } else {

        }


        res.end();

    } catch (err) {
        console.dir(err.stack);
    }
    next();
});

app.use('/', router);

//router 등록후 use로 요청/응답의 후처리가 가능한가?(tomcat, spring web mvc의 필터나 인터셉터(post)의 후처리처럼.)
//후처리 됨 . route 함수들은 전부 미들웨어 함수와 인수가 같아서, next()를 인수로 받는 애들은 다음 미들웨어로 처리를 넘겨준다.
//res.end()와는 상관없이.
app.use((req, res) => {
    console.log('RESTful API 요청시 언제나 수행됩니다. 왜냐면 나는 router 뒤에 붙은 후처리 미들웨어거든.');

})


// Express 서버 시작
http.createServer(app).listen(3000, function() {
    console.log('Express 서버가 3000번 포트에서 시작됨.');
});