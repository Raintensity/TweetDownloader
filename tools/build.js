const fsExtra=require("fs-extra");
const packager=require("electron-packager");
const package=require("../package");

const tempdir=".temp";
const outdir=".dist";

const exclude=["^/data"];

packager({
	name:package.custom.title,
	dir:"./"+tempdir,
	out:"./"+outdir+"/"+package.version,
	icon:"./resources/icon.ico",
	platform:"win32",
	arch:"x64",
	electronVersion:"2.0.1",
	overwrite:true,
	asar:true,
	appVersion:package.version,
	appCopyright:"Copyright (C) 2018 "+package.author+".",
	ignore:exclude,
	win32metadata:{
		CompanyName:"USX.JP",
		FileDescription:package.custom.title,
		OriginalFilename:package.custom.title+".exe",
		ProductName:package.custom.title,
		InternalName:package.custom.title
	}
}).then(path=>console.log("Complete :"+path)).catch(err=>console.log(err));
