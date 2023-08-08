import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import rTime from 'dayjs/plugin/relativeTime';


	
export const dayJS =()=>{
	dayjs.locale('zh-cn');
	dayjs.extend(rTime);
	return dayjs
}