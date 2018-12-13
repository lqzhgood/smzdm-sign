//取随机数 min = 最小值 ； max = 最大值
function getRandom(min, max) {
	return parseInt(Math.random() * (max - min + 1) + min, 10);
}

//转码ascii 转 native
function ascii2native(str = '') {
	let asciicode = str.split("\\u");
	let nativeValue = asciicode[0];
	for (let i = 1; i < asciicode.length; i++) {
		let code = asciicode[i];
		nativeValue += String.fromCharCode(parseInt("0x" + code.substring(0, 4), 10));
		if (code.length > 4) {
			nativeValue += code.substring(4, code.length);
		}
	}
	return nativeValue;
}

module.exports = {
	getRandom,
	ascii2native
};
