const fsExtra=require("fs-extra");
const package=require("../package");
const packageLock=require("../package-lock");

const tempdir=".temp";
const srcdir="src";

const excludeFile=["/modules/gettoken-example.js"];

//clean temp folder
var dir=fsExtra.readdirSync(tempdir);
for(var i=0;i<dir.length;i++){
	if(dir[i]==="data")continue;
	fsExtra.removeSync(tempdir+"/"+dir[i]);
	console.log("Deleted "+tempdir+"/"+dir[i]);
}
dir=null;

//copy sources
fsExtra.copySync(srcdir,tempdir);
console.log("Copied source dir.");

//Remove excluding files
excludeFile.forEach(filename=>{
	fsExtra.removeSync(tempdir+filename);
	console.log("Excluded "+tempdir+filename);
});

//copy node modules
fsExtra.mkdirSync(tempdir+"/node_modules");
console.log("Made "+tempdir+"/node_modules")
var dep=packageLock.dependencies;
Object.keys(dep).forEach(key=>{
	if(dep[key].dev)return;
	fsExtra.copySync("node_modules/"+key,tempdir+"/node_modules/"+key);
	console.log("Copied "+tempdir+"/node_modules/"+key);
});
dep=null;

//make package.json
var newPackage=Object.assign(package);
delete newPackage.devDependencies;
delete newPackage.scripts;
newPackage.main=package.main.split("/").pop();
fsExtra.writeFileSync(tempdir+"/package.json",JSON.stringify(newPackage));
console.log("Made "+tempdir+"/package.json");
delete newPackage;

console.log("Complete.");
