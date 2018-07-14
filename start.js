//front-servlet역할을 하는 js

//node.js : javascript 문법으로 server를 구성할 수 있다.
//어떻게? chrome용으로 javascript엔진을 오픈소스로 공개한 구글 덕분에
//이걸  javascript문법으로 시스템 자원을 건드릴 수 있는 프로그램을 만들자!
//해서 나온게 node.js

//프로토콜 
//암튼 req,res및 웹서버관련한 객체는 모조리 require로 요청해서 생성해얻는듯.
//require로 요청하는 애들은 객체가 아니라 모듈이란다 
var http = require('http');
//파일시스템
var fs = require('fs');

//request가 들어올때마다 생성하지 않도록 전역으로 뺀다.
//쿼리스트링을 다루는 방법 1 : 미련한 방법
var qs = require('querystring');
//쿼리스트링을 다루는 방법 2 : 직관적인 방법
var url = require('url');

//웹 어플리케이션 서버, http서버를 연다. request 리스너를 매개변수로하여 app객체를 생성한다.
var app = http.createServer(function(request, response) {
    //요청/응답객체
    //200 상태코드 반환이 디폴트
    response.writeHead(200);
    //요청객체의 다양한 속성중 url속성
    var reqUrl = request.url;
    console.log(reqUrl);
    var resUrl  = "";
    var returnPage = "";
    var encoding = 'utf-8';

    //url속성엔 host:port는 제외하고 순수 리소스 위치만 ==> uri(uniform resource identifier)가 host+port+url(uniform resource location),
    if (reqUrl == '/') {
        resUrl = '/index.html';
        //쿼리스트링을 다루는 미련한 방법
        var query = reqUrl.split('?')[1];
        if (query != null) {
            var q = qs.parse(query);
            console.log(q.name);
            console.log(q.age);
            console.log(q.hoho);
        }
        //쿼리스트링을 다루는 직관적인 방법
        var queryString = url.parse(reqUrl, true).query;
        if (queryString.name) {
            console.log('쿼리스트링을 다루는 직관적인 방법 : ' + queryString.name);
        }

        //배열임
        console.log('keys : ' + Object.keys(queryString));
        console.log('propNames : ' + Object.getOwnPropertyNames(queryString));
        console.log('type of : ' + typeof Object.keys(queryString));

        var keys = Object.keys(queryString);


        console.log('---------쿼리스트링 파라미터 전부출력 ----------');
        for (var i in keys) {
            console.log(keys[i] + ':' + queryString[keys[i]]);
        }

        //아 이제알았다 ;; javascript에서 여러줄 string : ``
        //헐... javascript string에는 이미 템플릿기능이 있었네;; : ${[variable]}
        var template = `${queryString['name']}`;
    } else if (reqUrl == '/board/new') {
        resUrl = '/writeForm.html'; 
    } else if(/^\/image\//.test(reqUrl)){
    	resUrl=reqUrl;
    	encoding=null;
    } else if (/^\/css\//.test(reqUrl)){
    	resUrl=reqUrl;
    	encoding=null;
    }else {
        //등록된 url외에 다른요청하면 404 상태코드 반환
        response.writeHead(404);
        resUrl='/errorPage.html';
    }

    fs.readFile(__dirname+resUrl, encoding, (error, data) => {
    	//여기서의 console은 nodejs가 실행되어있는 콘솔창
	    console.log(__dirname + resUrl);
	    //이건 좀신기한듯, 어떤 url을 요청해도 end에 어떤 파일을 넣어도 알아서 그 mime타입으로 반환해준다.
	    //아닌가? 요청한적도없는 json을 요청하고 막 지가 알아서 왔다갔다하나봄.
	    //response.end(fs.readFileSync(__dirname + '/image.jpg'));

	    //동적인 웹페이지를 반환한다.
	    //(위에 template에 있는 변수가 포함된 html코드 형식의 문자열을 반환한다.)
	    response.end(data);
    });

    
    
});
app.listen(3000); //port 3000번으로 서버를 연다.
