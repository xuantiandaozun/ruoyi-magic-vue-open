// 处理主题样式
export function handleThemeStyle(theme) {
	// 设置主色调
	document.documentElement.style.setProperty('--el-color-primary', theme)
	
	// 设置主色调的RGB值（用于透明度计算）
	const rgb = hexToRgb(theme)
	document.documentElement.style.setProperty('--el-color-primary-rgb', `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`)
	
	// 设置亮色系列
	for (let i = 1; i <= 9; i++) {
		document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, `${getLightColor(theme, i / 10)}`)
	}
	
	// 设置暗色系列
	for (let i = 1; i <= 9; i++) {
		document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, `${getDarkColor(theme, i / 10)}`)
	}
	
	// 设置边框颜色
	document.documentElement.style.setProperty('--el-border-color-hover', getLightColor(theme, 0.5))
	
	// 设置按钮悬停阴影颜色
	document.documentElement.style.setProperty('--el-button-hover-shadow', `0 4px 12px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`)
}

// hex颜色转rgb颜色
export function hexToRgb(str) {
	str = str.replace('#', '')
	let hexs = str.match(/../g)
	for (let i = 0; i < 3; i++) {
		hexs[i] = parseInt(hexs[i], 16)
	}
	return hexs
}

// rgb颜色转Hex颜色
export function rgbToHex(r, g, b) {
	let hexs = [r.toString(16), g.toString(16), b.toString(16)]
	for (let i = 0; i < 3; i++) {
		if (hexs[i].length == 1) {
			hexs[i] = `0${hexs[i]}`
		}
	}
	return `#${hexs.join('')}`
}

// 变浅颜色值
export function getLightColor(color, level) {
	let rgb = hexToRgb(color)
	for (let i = 0; i < 3; i++) {
		rgb[i] = Math.floor((255 - rgb[i]) * level + rgb[i])
	}
	return rgbToHex(rgb[0], rgb[1], rgb[2])
}

// 变深颜色值
export function getDarkColor(color, level) {
	let rgb = hexToRgb(color)
	for (let i = 0; i < 3; i++) {
		rgb[i] = Math.floor(rgb[i] * (1 - level))
	}
	return rgbToHex(rgb[0], rgb[1], rgb[2])
}
