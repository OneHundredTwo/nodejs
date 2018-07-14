: 이것은 nodejs http fileupload 예제를 위한 express 패키지와 관련해 필요한 패키지들을 추가하는 window용 batch 파일입니다.
: express http 서버 프레임워크
npm install express --save
: 잘 정의된 미들웨어들

: POST요청의 파라미터들을 자동으로 param에 할당해주는 미들웨어
npm install body-parser --save
: static 리소스 요청 url을 처리해주는 미들웨어
npm install serve-static --save
npm install errorHandler --save
: session 설정 및 cookie설정 담당 미들웨어
npm install cookie-parser --save
npm install express-session --save
: multipartform-data 요청 처리 미들웨어
npm install multer --save
: 클라이언트에서 ajax로 요청했을때 CORS - 다중 서버 접속 지원 처리 미들웨어
npm install cors --save
: express 오류핸들러
npm install express-error-handler --save
