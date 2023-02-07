let fs = require('fs');

function deleteFile(file){
   return new Promise ( (resolve, reject) => {
      fs.unlink(file, function(err){
         if (err) {
            console.log(`error deleting fie '${file}', err: ${JSON.stringify(err)}`);
            reject (err);
         }
         console.log(`deleted fie '${file}'`);
         resolve();
      });
   });
}


module.exports = class filehandler {
	
   constructor(){}
   
   async deleteFiles(files){
      if (!files || !files.length)
         return Promise.resolve();
      return new Promise ( (resolve) => {
         files.reduce( async(promise, file, index) => {
            await promise;
            console.log (`processing ${file}, index: ${index}`);
            await deleteFile (file);
            if (index == files.length - 1) {  // Only resolve after last file is processed
               console.log (`deleteFiles() : ${files.length} files deleted`);
               resolve();
            }
         }, Promise.resolve());
      });
   }
}