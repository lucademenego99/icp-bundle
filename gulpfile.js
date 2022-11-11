import del from 'del';
import child_process from 'child_process';

function cleanup(cb) {
    console.log("Deleting some files...");
    del(['dist/base/index.html']);

    console.log("Finished!");
    console.log("If you want to set up a single-file distributable web server, use dist/base/redbean.com and check the icp-create-server repository");
    console.log("If you want to use the library and deploy to a server, all you need is dist/base/icp-bundle.js");
    cb();
}

export default (cb) => {
    console.log("Building the project - this may take a while (approx. 5-6 minutes)...");
    child_process.exec('vite build -c=build-config/vite.full.js && vite build -c=build-config/vite.python.js && vite build -c=build-config/vite.javascript.js && vite build -c=build-config/vite.typescript.js && vite build -c=build-config/vite.java.js && vite build -c=build-config/vite.sql.js && vite build -c=build-config/vite.full-offline.js && vite build -c=build-config/vite.python-offline.js && vite build -c=build-config/vite.java-offline.js', (err, stdout, stderr) => {
        if (err) {
            console.log("[ERROR] building the project");
            cb(err);
        }

        console.log("Build completed! Setting up offline mode");

        child_process.exec("cd dist/base/ && chmod +x ../../bin/zip.com && ../../bin/zip.com -r redbean.com utils full-offline.iife.js reveal.js reveal.css blood.css white.css custom-style.css && ../../bin/zip.com -0 redbean.com index.html && chmod +x redbean.com", (err, stdout, stderr) => {
            if (err) {
                // Try to construct the path for windows systems
                child_process.exec("cd dist\\base\\ && ..\\..\\bin\\zip.com -r redbean.com full-offline.iife.js reveal.js reveal.css blood.css white.css custom-style.css && ..\\..\\bin\\zip.com -r -0 redbean.com utils index.html", (err, stdout, stderr) => {
                    if (err) {
                        console.log("[ERROR] zipping dist into redbean.com");
                        cb(err);
                    }
                    cleanup(cb);
                });
            } else {
                cleanup(cb);
            }
        })
    });
}
