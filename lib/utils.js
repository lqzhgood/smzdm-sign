//取随机数 min = 最小值 ； max = 最大值
let getRandom = (min, max) => {
	return parseInt(Math.random() * (max - min + 1) + min);
};

//转码ascii 转 native
let ascii2native = (str = '') => {
	let asciicode = str.split("\\u");
	let nativeValue = asciicode[0];
	for (let i = 1; i < asciicode.length; i++) {
		let code = asciicode[i];
		nativeValue += String.fromCharCode(parseInt("0x" + code.substring(0, 4)));
		if (code.length > 4) {
			nativeValue += code.substring(4, code.length);
		}
	}
	return nativeValue;
};

module.exports = {
	getRandom,
	ascii2native
};
