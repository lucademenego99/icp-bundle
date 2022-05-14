import del from 'del';
import child_process from 'child_process';

export default (cb) => {
    console.log("Building the project - this may take a while...");
    child_process.exec('npm run build', (err, stdout, stderr) => {
        if (err) {
            console.log("[ERROR] building the project");
            cb(err);
        }

        child_process.exec("cd dist/offline/ && chmod +x ../../zip.com && ../../zip.com -r redbean.com utils icp-bundle.umd.js && ../../zip.com -0 redbean.com index.html && chmod +x redbean.com", (err, stdout, stderr) => {
            if (err) {
                console.log("[ERROR] zipping dist into redbean.com");
                cb(err);
            }

            console.log("Deleting some files...");
            del(['dist/base/redbean.com', 'dist/offline/icp-bundle.es.js', 'dist/offline/utils', 'dist/offline/icp-bundle.umd.js', 'dist/offline/index.html']);

            console.log("Finished!");
            console.log("To run locally without needing an internet connection, run dist/offline/redbean.com and go to http://localhost:8080/");
            console.log("If you want to run it locally but you have an internet connection, you can just open dist/base/index.html in your browser");
            console.log("If you want to use the library and deploy to a server, all you need is dist/base/icp-bundle.umd.js");
            cb();
        })
    });
}
