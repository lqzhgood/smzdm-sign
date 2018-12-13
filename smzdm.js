const dayjs = require('dayjs');
const cheerio = require("cheerio"); //文档转换
const ejs = require("ejs"); //模板
const schedule = require("node-schedule"); //定时器

const fs = require('fs');

const R = require('request-promise-native').defaults({
	timeout: 5000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
	}
});
const { getRandom, ascii2native } = require('./lib/utils'); //工具类
const { MAIL_SEND } = require("./lib/mail"); //发邮件
const { Mode, CookieListValKey, CommitList } = require("./config"); //配置文件

//日志信息
let LogoInfoCommit = [];
let LogoInfoSign = [];


//文章列表 默认 首次进入时 getPostID 拿不到数据时 使用 （可能的情况 300-500页没数据了）
let POST_ID_LIST = ['9350354', '9328133', '9328024', '9350282', '9350254', '9328044', '9350219', '9350181', '9350166', '9343266', '9350093', '9350065', '9350031', '9349991', '9349977', '9349974', '9349943', '9349901', '9349892', '9349732'];

// TEST
(async () => {
	if (process.env.NODE_ENV == 'production') return;
	global.g = {
		LogoInfoCommit,
		LogoInfoSign
	};
	//获取最新 待评论的 文章id
	await getPostID(getCommitUrl(), 'https://www.smzdm.com/jingxuan/');
	// TEST
	for (let i = 0; i < CookieListValKey.length; i++) {
		let cookieSess = CookieListValKey[i];
		//签到
		await smzdmSign(cookieSess);
		//评论
		await smzdmCommit(cookieSess);
	}
	let data = { LogoInfoSign, LogoInfoCommit };
	console.log('All JSON', data);
	ejs.renderFile('./lib/mail-template.ejs', data, {}, (err, str) => {
		if (!err) {
			MAIL_SEND(`【日志】`, str);
		} else {
			MAIL_SEND(`【日志】`, `邮件渲染错误 ${err}`);
		}
	});
})();



//每天5点10执行 签到和评论
schedule.scheduleJob('30 10 5 * * *', async () => {
	//发现频道 最新
	await getPostID(getCommitUrl(), 'https://www.smzdm.com/jingxuan/');
	for (let i = 0; i < CookieListValKey.length; i++) {
		let cookieSess = CookieListValKey[i];
		//延迟签到
		if (Mode.sign) setTimeSmzdmSign(cookieSess);
		//发表三次评论
		if (Mode.commit) commitSettimeout(cookieSess);
	}
});



if (Mode.sendLogEmail) {
	//每天17点30 发邮件
	schedule.scheduleJob('30 30 17 * * *', () => {
		try {
			//使用ejs 模板引擎发送html 内容 2018-05-13
			let data = { LogoInfoSign, LogoInfoCommit };
			ejs.renderFile('./lib/mail-template.ejs', data, {}, (err, str) => {
				if (!err) {
					MAIL_SEND(`【日志】`, str);
				} else {
					MAIL_SEND(`【日志】`, `邮件渲染错误 ${err}`);
				}
			});
		} catch (error) {
			console.log(error.message);
		} finally {
			fs.writeFileSync(`./${dayjs().format('YYYYMMDD'.log)}`, JSON.stringify({
				LogoInfoSign,
				LogoInfoCommit
			}));
			//清空
			LogoInfoSign = [];
			LogoInfoCommit = [];
		}
	});
}

/**
 * [getCommitUrl  评论地址
 家居生活 发现频道 100 - 220 页 随机页数]
  小心没有数据 会一直使用 POST_ID_LIST 默认值
 * @method getCommitUrl
 * @return {[type]}     [评论地址]
 */
function getCommitUrl() {
	let random = getRandom(100, 220);
	let commitUrl = `https://faxian.smzdm.com/h1s0t0f37c0p${random}/`;
	return commitUrl;
}


/**
 * 什么值得买 获取用来评论的文章id
 * @param {Object} url 需要访问的url
 * @param {Object} refererUrl 来源url
 * @param {Object} cookie 用来请求的 cookie
 */
async function getPostID(url, refererUrl, cookie) {
	//如果没传值 随机取一个cookie 防止重复提交
	let options = {
		url,
		headers: {
			Cookie: cookie ? cookie : CookieListValKey[getRandom(0, CookieListValKey.length - 1)].cookies,
			Referer: refererUrl
		}
	};
	try {
		let data = await R(options);
		let tempPostIdList = [];
		let $ = cheerio.load(data);
		$('.feed-ver-pic').each((i, e) => {
			let href = $(e).find('a').eq(0).attr('href');
			tempPostIdList.push(href.substring(href.indexOf('/p/') + 3, href.length - 1));
		});
		//获取新列表，再更新，否则不更新
		if (tempPostIdList.length > 0) {
			POST_ID_LIST = tempPostIdList;
			console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} 评论列表更新成功 ${tempPostIdList.length}`);
		} else {
			console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} 评论列表更新失败`);
		}
	} catch (err) {
		MAIL_SEND('【评论文章列表报错】', `时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} <br/>错误内容: <br/>${err.message}`);
	}
}

/**
 * 延迟签到
 * @method setTimeSmzdmSign
 * @param  {Object}         cookieSess 某一个用户的Config
 */
function setTimeSmzdmSign(cookieSess) {
	setTimeout(() => {
		//签到
		console.log(`开始签到 ${cookieSess.username}`);
		smzdmSign(cookieSess);
	}, getRandom(1, 100) * 1000);
}

/**
 * 什么值得买签到
 * @param {Object} cookieSess 某一个用户的Config
 */
async function smzdmSign(cookieSess) {
	let cookie = cookieSess.cookies;
	let cookieName = cookieSess.username;
	let referer = 'http://www.smzdm.com/qiandao/';
	let options = {
		url: 'https://zhiyou.smzdm.com/user/checkin/jsonp_checkin?callback=jQuery112409568846254764496_' + Date.now() + '&_=' + Date.now(),
		headers: { Cookie: cookie, Referer: referer }
	};
	try {
		let data = await R(options);
		let resJson = JSON.parse(data.match(/{.+}/)[0]);
		if (resJson.error_code != 0) throw new Error(JSON.stringify(resJson));
		makeLogo(LogoInfoSign, { cookieSess, data, jsonData: resJson.data });
		console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} - 签到成功! ${cookieName}`);
	} catch (err) {
		console.log('签到错误', err.message);
		MAIL_SEND('【签到报错】', `时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}  <br/>用户: ${cookieName} <br/>错误内容: <br/>${err.message}`);
	}
}


//评论三次 执行时间自定
function commitSettimeout(cookieSess, timeNum = 1) {
	if (timeNum >= 4) {
		return;
	}
	//延迟发评论
	setTimeout(async () => {
		//发现频道 最新
		await getPostID(getCommitUrl(), 'https://www.smzdm.com/jingxuan/', cookieSess.cookies);
		setTimeout(() => {
			console.log(`开始第 ${timeNum} 次评论 ${cookieSess.username}`);
			smzdmCommit(cookieSess);
		}, 5000);
	}, getRandom(4 * 60, 10 * 60) * 1000);

	setTimeout(() => {
		timeNum++;
		commitSettimeout(cookieSess, timeNum);
	}, getRandom(6 * 60, 100 * 60) * 1000 * timeNum);

}



/**
 * 什么值得买 评论
 * @param {Object} cookieSess cookie信息
 */
async function smzdmCommit(cookieSess) {
	let cookie = cookieSess.cookies;
	let cookieName = cookieSess.username;
	let referer = 'https://zhiyou.smzdm.com/user/submit/';
	let pId = POST_ID_LIST[Math.floor(Math.random() * POST_ID_LIST.length)];
	let options = {
		url: 'https://zhiyou.smzdm.com/user/comment/ajax_set_comment?callback=jQuery111006551744323225079_' + Date.now() + '&type=3&pid=' + pId + '&parentid=0&vote_id=0&vote_type=&vote_group=&content=' + encodeURI(CommitList[Math.floor(Math.random() * CommitList.length)]) + '&_=' + Date.now(),
		headers: { Cookie: cookie, Referer: referer }
	};
	try {
		let data = await R(options);
		let resJson = JSON.parse(data.match(/{.+}/)[0]);
		if (resJson.error_code != 0) throw new Error(JSON.stringify(resJson));
		makeLogo(LogoInfoCommit, { cookieSess, data, jsonData: resJson.error_msg, pId });
		console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} - 评论成功 ${cookieName} ${resJson.error_msg.comment_ID}`);
		// 删除 评论
		setTimeout(() => {
			if (Mode.autoDelCommit) smzdmDelCommit(cookieSess, resJson.error_msg.comment_ID);
		}, getRandom(10, 40) * 1000);
	} catch (err) {
		console.log('评论错误', err.message);
		MAIL_SEND('【评论报错】', `时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}  <br/>用户: ${cookieName} <br/>错误内容: <br/>${err.message}`);
	}
}


async function smzdmDelCommit(cookieSess, comment_id) {
	//	let num = Math.floor(Math.random() * 900);
	let cookie = cookieSess.cookies;
	let cookieName = cookieSess.username;
	let referer = 'https://zhiyou.smzdm.com/user/submit/';
	let options = {
		method: 'POST',
		url: `https://zhiyou.smzdm.com/user/comment/ajax_del_comment?callback=jQuery112404079034035895881_${Date.now()}`,
		headers: { Cookie: cookie, Referer: referer },
		form: { comment_id, operator: 0 }
	};
	try {
		let data = await R(options);
		let resJson = JSON.parse(data.match(/{.+}/)[0]);
		if (resJson.error_code != 0) throw new Error(JSON.stringify(resJson));
		console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")} - 评论删除成功 ${cookieName} ${comment_id}`);
	} catch (err) {
		console.log('删除评论错误', err.message);
		MAIL_SEND('【评论删除错误】', `时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}  <br/>用户: ${cookieName} <br/>错误内容: <br/>${err.message}`);
	}
}


function makeLogo(arr, obj) {
	let { cookieSess, data, jsonData, pId } = obj;
	//记录评论日志
	let logInfo = {};
	logInfo.cookie = cookieSess.username;
	logInfo.date = dayjs().format("YYYY-MM-DD HH:mm:ss");
	logInfo.data = ascii2native(data);
	logInfo.jsonData = jsonData;
	logInfo.pId = pId;
	arr.push(logInfo);
}
