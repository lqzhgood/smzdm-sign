/**
 * 项目配置表
 * 邮件推荐使用qq邮箱，其他邮箱可能协议方面要自行设置
 * xuess<wuniu2010@126.com>
 * 2018-04-17
 */

// email 登陆账号 如：xxxx@qq.com
const emailName = 'xxx@qq.com';
// email 登陆密码
const emailPassword = 'xxxx';
// 接收者 邮箱
const toEmail = 'xxxx@xx.com';

//用于签到的 账号信息 列表
const CookieListValKey = [{
	'username': 'xx',
	'phone': 'xx',
	'cookies': 'xxxxx'
}, ];


//回复列表 用于发表评论的内容
let CommitList = [
	'感谢爆料，很不错啊',
	'现在这个价格还可入手吗',
	'感谢爆料，价格不错的',
];

const Mode = {
	sign: true,
	commit: true,
	autoDelCommit: true,
	sendLogEmail: true
};

module.exports = {
	emailName,
	emailPassword,
	toEmail,
	CookieListValKey,
	CommitList,
	Mode
};

// 积分日志 https://zhiyou.smzdm.com/user/point/
