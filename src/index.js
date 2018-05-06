const electron=require("electron");
const {app,dialog,shell}=electron;
const fs=require("fs");

const package=require("./package");

try{
	fs.accessSync(process.cwd()+"/data",fs.constants.F_OK);
}catch(e){
	fs.mkdirSync(process.cwd()+"/data");
}

try{
	fs.accessSync(process.cwd()+"/data/app",fs.constants.F_OK);
}catch(e){
	fs.mkdirSync(process.cwd()+"/data/app");
}

try{
	fs.accessSync(process.cwd()+"/data/media",fs.constants.F_OK);
}catch(e){
	fs.mkdirSync(process.cwd()+"/data/media");
}

app.setPath("appData",process.cwd()+"/data/app");
app.setPath("userData",process.cwd()+"/data/app");

let win=null;

app.on("ready",()=>{
	win=new electron.BrowserWindow({
		width:1024,
		height:768,
		title:package.custom.title
	});
	win.setMenu(null);
	win.on("closed",()=>{
		win=null;
	});
	win.webContents.on("new-window",(e,url)=>{
		e.preventDefault();
		shell.openExternal(url);
	});
	win.loadURL(__dirname+"/lib/main.html");
	//win.webContents.openDevTools();
});

app.on("window-all-closed",()=>{
	app.quit();
});
