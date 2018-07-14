var winston = require('winston'); // 로그처리 모듈
var winstonDaily = require('winston-daily-rotate-file');
var moment = require('moment'); //헐... moment 
//기본모듈이 아니라, 다 npm으로 설치해야함.

function timeStampFormat(){
	return moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
}

var logger = new (winston.Logger)({
	transports:[
	new (winstonDaily)({
		name:'info-file',
		filename: './log/server',
		datePattern: '_yyyy-MM-dd.log',
		colorize: false,
		maxsize:50000000,
		maxFiles:1000,
		level:'info',
		showLevel: true,
		json:false,
		timestamp:timeStampFormat
	}),
	new (winston.transports.Console)({
		name:'debug-console',
		colorize:true,
		level:'debug',
		showLevel:true,
		json:false,
		timestamp:timeStampFormat
	})
	],
	exceptionHandlers:[
		new (winstonDaily)({
			name:'exception-file',
			filename: './log/exception',
			datePattern: '_yyyy-MM-dd.log',
			colorize:false,
			maxsize:50000000,
			maxFiles:1000,
			level:'error',
			showLevel:true,
			json:false,
			timestamp:timeStampFormat
		}),
		new(winston.transports.Console)({
			name:'exception-console',
			colorize:true,
			level:'debug',
			showLevel:true,
			json:false,
			timestamp:timeStampFormat
		})
	]
});