import { defineStore } from 'pinia';
import { config } from '../asset/config/config.js';
import { isRequestOK, requestHandler } from '@/utils/handlerFunction.js';

export const useUserStore = defineStore('user', {
	state: () => {
		return {
			pageInfo:{},
			// 调用 wx.login() 后返回的 code   {errMsg: "login:ok", code: "0c14OzFa1pCgTF0blFGa1heTQv04OzFd"}
			weChatLandingCode:'',
			authToken:'',
			userInfo:{
				openid: '',
				sessionKey: '',
				avatarUrl: '../../static/tabBar/me-gray.png',
				originAvataUrl: '',
				localAvatarUrl: '',
				nickname: '',
				realName: '',
				email: '',
				mobile: '',
				
				// addr: ""
				// avatarUrl: ""
				// cardType: null
				// cityCode: ""
				// cityName: ""
				// countyCode: ""
				// countyName: ""
				// createBy: null
				// createTime: "2023-04-18 14:41:07"
				// email: "b***********@qq.com"
				// gender: "0"
				// id: "1648215058037104642"
				// idNumber: "**************2811"
				// mobile: "150****3028"
				// nickname: "快乐小达人"
				// provinceCode: ""
				// provinceName: ""
				// realName: "张三"
				// status: "0"
				// username: "admin"
				
				
			},
			SystemInfo:{
			// 	model: "iPhone 14 Pro Max",
			// 	osName: "ios",
			// 	osVersion: "10.0.1",
			// 	safeArea:{},
			// 	safeAreaInsets:{},
			// 	screenHeight: 926,
			// 	screenWidth: 428,
			// 	statusBarHeight: 59,
			// 	system: "iOS 10.0.1",
			},
			// notReadNoticeInfo:{
			// 	show: false,
			// 	num: 0,
			// },
			// noticeIsClose: false,
			lessThanFive: true,
		}
	},
	actions: {
		// 登录			/charity-system/app-api/wx/user/me
		async login(){
			const self = this;
			let url = config.API + 'pro_web/app/wx/user/login?code=';
			let loginRes = null;
			await new Promise((resolve,reject)=>{
				wx.login({
					success (res) {
						if (res.code) {
							console.log( ' store wx res -> ', res );
							self.weChatLandingCode = res.code;
							url += res.code;
							uni.request({
								url, 
								method:'GET',
								timeout:9000,
								success: (res) => {
									console.log( ' store login res -> ', res );
									if( res && res.data && res.data.authToken && res.data.authToken.length > 20 ){
										self.authToken = res.data.authToken;
										let temp = {...res.data};
										temp.originAvataUrl = res.data.avatarUrl;
										try{
											temp.localUserInfo = uni.getStorageSync('userInfo');
										}catch(e){}
										// temp.avatarUrl = temp.localUserInfo.avatarUrl || self.userInfo.avatarUrl;
										temp = {
											...temp.localUserInfo,
											...res.data
										};
										console.log( ' store 合并用户信息 temp -> ', temp );
										
										// delete temp.authToken;
										// delete temp.localUserInfo;
										self.setUserInfo( temp );
										temp = null;
										// self.userInfo.openid = res.data.openid;
										// self.userInfo.sessionKey = res.data.sessionKey;
									}
									loginRes = res;
									resolve(res);
								}
							});
						} else { reject('登录失败！' + res.errMsg ) }
					}
				})
			});
			console.log( ' # store login loginRes -> ', loginRes );
			uni.setStorageSync( 'token', loginRes.data.authToken );
			return loginRes;
		},
		// 设置用户信息
		setUserInfo( obj ){
			Object.keys( obj ).forEach(key=>{
				this.userInfo[key] = obj[key];
			});
			
			// this.userInfo.openid = obj.openid;
			// this.userInfo.sessionKey = obj.sessionKey;
			// this.userInfo.avatarUrl = obj.avatarUrl;
			// this.userInfo.nickname = obj.nickname;
			try{
				uni.setStorageSync( 'userInfo', {...this.userInfo} );
			}catch(e){
				//TODO handle the exception
			}
		},
		
		// 获取手机号
		weChatGetPhoneNumber(){
			wx.login({
			  success (res) {
			    if (res.code) {
						uni.request({
							url: 'https://api.weixin.qq.com/sns/jscode2session',  
								method:'GET',  
								data: {  
									// appid: weChatLoginInfo.appid,    
									// secret: weChatLoginInfo.secret,    
									js_code: this.weChatLandingCode,     
									grant_type: 'authorization_code',
								},  
								success: (sjh) => {  
									console.log( 'sjh ', sjh );
								}  
							}); 
			    } else { reject('获取手机号失败！' + res.errMsg ) }
			  }
			})
		},
		// 设置 setPageInfo
		setPageInfo(obj){
			if(!obj){return}
			if( Object.keys(this.SystemInfo).length < 3 ){this.setSystemInfo();}
			
			this.pageInfo = {...obj};
			if( 
				Object.keys(this.SystemInfo).includes('screenWidth') 
				&& (this.SystemInfo.screenWidth / this.SystemInfo.screenHeight) < 0.5
			){
				// iPhoneX 以上
				this.lessThanFive = true;
				this.pageInfo.indexTopSafeareaHeight = obj.top + obj.top*(27/41);
				this.pageInfo.otherPageTopSafeareaHeight = obj.top + obj.top*(27/41) + 12;
			}else{
				// iPhoneX 以下及 Android
				this.lessThanFive = false;
				this.pageInfo.indexTopSafeareaHeight = obj.top + obj.top*(27/41) + 20;
				this.pageInfo.otherPageTopSafeareaHeight = obj.top + obj.top*(27/41) + 28;
			}
			console.log( ' [store] 设置 setPageInfo end -> ',  );
		},
		// 设置系统信息
		setSystemInfo(){
			let SystemInfo = null;
			try{
				SystemInfo = uni.getStorageSync( 'SystemInfo' );
				this.SystemInfo = SystemInfo ? {...SystemInfo} : this.SystemInfo;
			}catch(err){
				console.log( ' [store] 获取 SystemInfo 出错 err -> ', err );
			}
			// console.log( ' [store] SystemInfo -> ', SystemInfo );
			console.log( ' [store] this.SystemInfo -> ', this.SystemInfo );
			// SystemInfo = null;
		},
		
		// 头像下载
		async getAvatarHandler(str){
			console.log( ' [store] getAvatarHandler authToken -> ', this.authToken );
			let result = '';
			await new Promise((resolve,reject)=>{
				uni.request({
					url: config.API + '/charity-system/app-api/wx/user/downloadAvatar?filePath=' + str,
					method:'GET',
					header: {'Authorization': this.authToken },
					success(res) {
						// uni.showToast({
						// 	title: '更新成功',
						// 	duration: 2000
						// });
						result = res;
						resolve(res);
					},
					fail(err) {
						// uni.showToast({
						// 	title: '更新失败',
						// 	duration: 2000
						// });
						reject(err)
					},
					// complete: (res) => {
					// 	console.log( ' [store] getAvatarHandler res -> ',  res );
					// }
				});
			});
			return result;
		},
		
		// // 未读消息条数
		// async getNoticeSize(){
		// 	const res = await requestHandler({
		// 		url: '/charity-system/app-api/sys-notices/notice_size',
		// 		method:'GET',
		// 	});
		// 	console.log( ' 未读消息条数 res -> ', res );
		// 	if( !isRequestOK(res) ){return false}
		// 	this.notReadNoticeInfo.show = res.data.result>0?true:false;
		// 	this.notReadNoticeInfo.num = res.data.result;
		// 	// 请求成功
		// 	return true;
		// },
		// setNoticeIsClose(){
		// 	this.noticeIsClose = true;
		// }
	},
});