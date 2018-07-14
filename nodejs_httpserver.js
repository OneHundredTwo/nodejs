var http = require('http');
//request listner를 생성시 할당할 수 도 있고,
// httpWebAppServer.on('request', (req,res) => {}) 식으로 따로 할당할 수도 있다.
var httpWebAppServer = http.createServer((req, res) => {
		//요청이 들어올때 수행하는 이벤트리스너
		var reqUrl = req.url;
		showParams(reqUrl);

		res.writeHead(200);
		res.end("hi");
});
//클라이언트 연결 이벤트 처리 : tcp 소켓 연결시 
httpWebAppServer.on('connection', (socket) => {
	console.log("--show sockets props--");
	showProps(socket);

	var addr = socket.address();

	console.log('클라이언트가 접속했습니다 : %s %d', addr.address, addr.port);
});

//서버 종료 이벤트 처리 
httpWebAppServer.on('close', () => { console.log('서버가 종료됩니다.')});

const URL = require('url');

var port = 3000;
var host  = '192.168.26.231'; // host를 특정하면 localhost는 접속이안됨.
var queueSize = 3000;




//서버를 연다.
httpWebAppServer.listen(port, host, queueSize, () => {
	//서버가 열리면 수행하는 콜백함수
	console.log('server open! '+ port + " : "+ host);
	console.log('max req number is '+ queueSize);
});

function showParams(reqUrl){
	//쿼리스트링을 다루는 직관적인 방법
        var queryString = URL.parse(reqUrl, true).query;
        //배열임
        /*console.log('keys : ' + Object.keys(queryString));
        console.log('propNames : ' + Object.getOwnPropertyNames(queryString));
        console.log('type of : ' + typeof Object.keys(queryString));
*/
        var keys = Object.keys(queryString);


        console.log('---------쿼리스트링 파라미터 전부출력 ----------');
        for (var i in keys) {
            console.log(keys[i] + ':' + queryString[keys[i]]);
        }
}

function showProps(object){
	var keys = Object.keys(object);


    console.log('--오브젝트 속성:값 전부출력--');
    for (var i in keys) {
    	//console.log(keys[i] + " : " + typeof object[keys[i]]);
        
        	console.log(keys[i] + ':' + (typeof object[keys[i]]=='object'||typeof object[keys[i]]=='function'?'object or function':object[keys[i]]));
    }
}