const util={
	zeroPadding:(x,n)=>(Array(n).join("0")+x).slice(-n),
	dateFormat:function(dateObj){
		let [year,month,day,hour,minute,second]=[dateObj.getFullYear(),dateObj.getMonth()+1,dateObj.getDate(),dateObj.getHours(),dateObj.getMinutes(),dateObj.getSeconds()];
		[month,day,hour,minute,second]=[this.zeroPadding(month,2),this.zeroPadding(day,2),this.zeroPadding(hour,2),this.zeroPadding(minute,2),this.zeroPadding(second,2)];
		return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
	}
};

module.exports=util;
