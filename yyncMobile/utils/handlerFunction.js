import { config } from '@/asset/config/config.js';
import { useUserStore } from '@/stores/user.js';



// let userStore = useUserStore() || null;

// 获取用户信息
export function getUserInfo(){
	return new Promise( (resolve)=>{
		wx.getUserProfile({
			provider: 'weixin',
			desc: '用于完善会员资料', 
			success: (res) => {
				console.log( ' wx.getUserProfile ', res );
				resolve(res);
			}
		})
	});
}


// 获取元素的 信息
export function getElementInfo( str, cb ){
	uni.createSelectorQuery().select( str ).boundingClientRect((res)=>{
		cb( res )
	}).exec();
}

export function isPhone (value) {
  if (!value) {return false}
  const pattern = /^1[3|4|5|6|7|8|9][0-9]{9}$/;
	return pattern.test(value) ? true : false;
}

// 2 数字相加
export function addition(arr,times){
	let d = arr.reduce((acc,curr)=>{
		return acc += Math.pow(10,times)*curr
	},0);
	return d/Math.pow(10,times)
}

export const setPageNavHeight = (pageNavHeight)=>{
	const userStore = useUserStore();
	if( userStore.$state.pageInfo.otherPageTopSafeareaHeight > 0 ){
		pageNavHeight.value = userStore.$state.pageInfo.otherPageTopSafeareaHeight;
	}else{
		let res = wx.getMenuButtonBoundingClientRect();
		userStore.setPageInfo(res);
		pageNavHeight.value = userStore.$state.pageInfo.otherPageTopSafeareaHeight;
		res = null;
	}
};


export const isRequestOK = (res)=>{
	if( !res ){return false}
	if( !Object.keys(res).includes('data') ){return false}
	if( 
		!Object.keys(res.data).includes('code') 
		|| !Object.keys(res.data).includes('msg') 
		|| !Object.keys(res.data).includes('result') 
	){return false}
	
	return res.data.code =="00000" || res.data.msg.includes('成功')
		? true : false;
}
// 再次登录
export async function redoLogin( callback ){
	const userStore = useUserStore();
	// const res = await callback();
	try{
		await userStore.login();
		return await callback();
	}catch(err){
		console.log( '【handlerFunction】 redoLogin err -> ', err );
	}
}


// 代理请求
export async function requestHandler(obj){
	const APIfunctionTypeName = obj.APIfunctionTypeName ? obj.APIfunctionTypeName : 'request';
	const userStore = useUserStore();
	// console.log( ' 代理请求 requestHandler config.API -> ', config.API );
	
	if(typeof(obj) != 'object'){ return console.log('请求类型错误！')}
	if(
		!Object.keys(obj).includes('url')
		|| !Object.keys(obj).includes('method')
	){ return console.log('请求类型错误！')}
	
	const sendData = {
		header:{'Authorization': ''},
		data:{},
		...obj
	};
	sendData.url = config.API + obj.url;
	sendData.header = Object.keys(obj).includes('header')
		? { ...sendData.header, ...obj.header } : sendData.header;
	
	// console.log( ' 代理请求 requestHandler sendData.url -> ', sendData.url );
	
	
	// 获取本地 token
	try{
		sendData.header['Authorization'] = userStore.$state.userInfo.authToken || uni.getStorageSync('token');
	}catch(e){}
	if( sendData.header['Authorization'] == '' ){
		try{
			sendData.header['Authorization'] = await userStore.login();
			sendData.header['Authorization'] = sendData.header['Authorization'].data.authToken;
		}catch(e){}
	}
	if( sendData.method.toLocaleLowerCase() == 'get' ){delete sendData.data;}
	console.log( ' requestHandler sendData -> ', sendData );
	
	const data = {
		result: null,
		redoLoginResponse:'',
		requestFunction: ()=>{
			return new Promise(resolve=>{
				// uni.request({
				uni[APIfunctionTypeName]({
					// url: config.API + obj.url,
					// method: obj.method,
					// header: { 'Authorization': loginInfo.token, ...obj.header },
					// data: obj.data,
					
					...sendData,
					complete: (res) => {resolve(res);}
				});
			});
		},
	};
	
	
	try{
		data.result = await data.requestFunction();
	}catch(err){}
	
	if( data.result.statusCode == 401 ){
		console.log( ' 代理请求 401 data.result.statusCode -> ', data.result.statusCode );
		// data.result = await redoLogin( data.requestFunction );
		data.redoLoginResponse = await userStore.login();
		console.log( ' 代理请求 401【222】 data.redoLoginResponse -> ', data.redoLoginResponse );
		sendData.header['Authorization'] = data.redoLoginResponse.data.authToken;
		console.log( ' 代理请求 401【222】 sendData.header -> ', sendData.header );
		console.log( ' 代理请求 401【222】 data.result -> ', data.result );
		console.log( ' 代理请求 401【222】 data.result.statusCode -> ', data.result.statusCode );
		
		try{
			data.result = await data.requestFunction();
		}catch(err){}
	}
	return {...data.result};
}
	
	
	
	
	
	