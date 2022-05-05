import del from 'del';
import child_process from 'child_process';

export default (cb) => {
    console.log("Building the project - this may take a while...");
    child_process.exec('npm run build', (err, stdout, stderr) => {
        if (err) {
            console.log("[ERROR] building the project");
            cb(err);
        }

        console.log("Creating the site with redbean...");
        child_process.exec('..\\..\\bin\\zip.com -0 -r redbean.com utils && ..\\..\\bin\\zip.com -r redbean.com index.html icp-bundle.umd.js', { cwd: 'dist/offline' }, (err, stdout, stderr) => {
            if (err) {
                child_process.exec('..\\..\\bin\\zip.com -0 -r redbean.com utils && ..\\..\\bin\\zip.com -r redbean.com index.html icp-bundle.umd.js', { cwd: 'dist/offline' }, (err, stdout, stderr) => {
                    if (err) {
                        console.log("[ERROR] creating the site with redbean");
                        cb(err);
                    }
                });
            }
            console.log("Deleting some files...");
            del(['dist/base/redbean.com', 'dist/offline/utils', 'dist/offline/icp-bundle.es.js', 'dist/offline/icp-bundle.umd.js', 'dist/offline/index.html']);

            console.log("Finished!");
            console.log("To run locally without needing an internet connection, run dist/offline/redbean.com and go to http://localhost:8080/");
            console.log("If you want to run it locally but you have an internet connection, you can just open dist/base/index.html in your browser");
            console.log("If you want to use the library and deploy to a server, all you need is dist/base/icp-bundle.umd.js");
            cb();
        });
    });
}
