var fs = require('fs');
//javascript 의 람다표현식
//두번째인수가 인코딩방식, 없으면 default는 byte stream인듯
//readFile은 비동기방식 => 읽는도중에 바뀔 수 있다.
fs.readFile(__dirname+'/dummy.txt','utf-8', (err, data) => {
	if(err) throw err;
	console.log(data);
});

//readFileSync는 동기방식 => 파일을 읽는동중에 선점한다. 
//==> 아니여따. 스레드를 따로돌릴거냐 메인스레드에서 순차적으로 할거냐를 동기/비동기로 표현한 것
// 파일 읽기를 동기적으로 : mainthread에서 파일읽기를 먼저하고 그다음코드 수행
// 파일 읽기를 비동기적으로 : 스레드를 따로 생성해서 파일읽기를 따로수행, 그리고 다되면 콜백함수 수행.

fs.readFileSync(__dirname+'/dummy.txt','utf-8', (err, data) => {
	if(err) throw err;
	console.log(data);
});

var fspromise = fs.promises;
fspromise.readdir(__dirname,)