import type { MusicPlayerConfig } from "../types/musicConfig";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 禁用音乐播放器方法：
	// 模板默认侧边栏和导航栏两个都显示
	// 1. 侧边栏：在sidebarConfig.ts侧边栏配置把音乐组件enable设为false禁用即可
	// 2. 导航栏：在本配置文件把showInNavbar设为false禁用即可

	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否显启用歌词
	showLyrics: false,

	// Meting API 配置
	meting: {
		// Meting API 地址
		// 默认使用官方 API，也可以使用自定义 API
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "playlist",
		// 歌单/专辑/单曲 ID 或搜索关键词
		id: "10046455237",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/使一颗心免于哀伤-哼唱.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{
				name: "多么快乐的一天",
				artist: "林力建",
				url: "https://res.cloudinary.com/tb7kje9k/video/upload/v1784223228/%E5%A4%9A%E4%B9%88%E5%BF%AB%E4%B9%90%E7%9A%84%E4%B8%80%E5%A4%A9_z76nmk.ogg",
				cover: "/assets/music/cover/lin_cover_thumb.webp",
				lrc: "",
			},
			{
				name: "女人善变",
				artist: "林力建",
				url: "https://res.cloudinary.com/tb7kje9k/video/upload/v1784223228/%E5%A5%B3%E4%BA%BA%E5%96%84%E5%8F%98_vrvvs5.ogg",
				cover: "/assets/music/cover/lin_cover_thumb.webp",
				lrc: "",
			},
			{
				name: "我爱你中国",
				artist: "林力建",
				url: "https://res.cloudinary.com/tb7kje9k/video/upload/v1784223228/%E6%88%91%E7%88%B1%E4%BD%A0%E4%B8%AD%E5%9B%BD_pmurbb.ogg",
				cover: "/assets/music/cover/lin_cover_thumb.webp",
				lrc: "",
			},
			{
				name: "我亲爱的",
				artist: "林力建",
				url: "https://res.cloudinary.com/tb7kje9k/video/upload/v1784223228/%E6%88%91%E4%BA%B2%E7%88%B1%E7%9A%84_dr1jn3.ogg",
				cover: "/assets/music/cover/lin_cover_thumb.webp",
				lrc: "",
			},
			{
				name: "两地曲",
				artist: "林力建",
				url: "https://res.cloudinary.com/tb7kje9k/video/upload/v1784223228/%E4%B8%A4%E5%9C%B0%E6%9B%B2_mbg0x0.ogg",
				cover: "/assets/music/cover/lin_cover_thumb.webp",
				lrc: "",
			},
		],
	},
};
