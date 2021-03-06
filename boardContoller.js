//express framework(?)를 이용한 RESTful API 서버 구현

//불러온 익스프레스 객체에는 하나의 함수가 할당되는데 그 함수를 실행하면 익스프레스 객체가 생성됩니다.
//익스프레스 클래스를 이용해 익스프레스 객체를 만든다고 생각하면 됩니다.
//이것을 익스프레스 어플맄이션이라고 하는데 , 이를 app에 할당했다.
const express = require('express');
const app = express();

//익스프레스 인스턴스 하나가 서버역할을 하는데 크게 보면 서버를 세팅하고 서버를 구동하는 역할을 합니다.
//서버를 세팅하는 것은 서버에 필요한 기능을 추가한다고 보면 된느데, 익스프레스에서 서버의 기능을 미들웨어 형태로 존재합니다.
//그리고 이 미들웨어에서 익스프레스 인스턴스의 use()함수로 추가할 수 있습니다.
//예를 들어 서버에서 정적파일(WAS이전의 단순 리소스서버)를 호스팅 할때는 다음과 같이 정적 파일설어을 위한 미들웨어를 추가할 수 있습니다.
app.use(express.static('public'));

//앞으로 API 서버 기능을 확장하면서 필요한 미들웨어를 찾아서 추가할 것입니다.


//라우팅  : 클라이언트 요청과 서버의 로직을 연결하는 것.
//Method가 GET방식의 '/' 과 hello wolrd를 출력하는 로직을 라우팅함.
//여기에서 req, res는 nodejs 기본모듈인 HTTP의 클래스 ClientRequest, ServerResponse와는 다름.
//express request 클래스, express response 클래스
app.get('/', (req, res) => {
	res.send('Hello World!\n');
})

app.listen(3000, () => {
	console.log('example app 3000! ');
});
console.log('fuckyou git');