import del from 'del';
import child_process from 'child_process';

function cleanup(cb) {
    console.log("Deleting some files...");
    del(['dist/base/redbean.com', 'dist/base/index.html', 'dist/offline/icp-bundle.es.js', 'dist/offline/icp-bundle.umd.cjs', 'dist/offline/utils', 'dist/offline/assets/', 'dist/offline/icp-bundle.js', 'dist/offline/index.html', 'dist/offline/blood.css', 'dist/offline/custom-style.css', 'dist/offline/reveal.css', 'dist/offline/reveal.js']);

    console.log("Finished!");
    console.log("If you want to set up a single-file distributable web server, use dist/offline/redbean.com and check the icp-create-server repository");
    console.log("If you want to use the library and deploy to a server, all you need is dist/base/icp-bundle.js");
    cb();
}

export default (cb) => {
    console.log("Building the project - this may take a while (approx. 5-6 minutes)...");
    child_process.exec('vite build -c=build/vite.full.js && vite build -c=build/vite.python.js && vite build -c=build/vite.javascript.js && vite build -c=build/vite.typescript.js && vite build -c=build/vite.java.js && vite build -c=build/vite.sql.js && vite build -c=build/vite.full-offline.js && vite build -c=build/vite.python-offline.js', (err, stdout, stderr) => {
        if (err) {
            console.log("[ERROR] building the project");
            cb(err);
        }

        console.log("Build completed! Setting up offline mode");

        child_process.exec("cd dist/offline/ && chmod +x ../../bin/zip.com && ../../bin/zip.com -r redbean.com utils icp-bundle.js reveal.js reveal.css blood.css custom-style.css && ../../bin/zip.com -0 redbean.com index.html && chmod +x redbean.com", (err, stdout, stderr) => {
            if (err) {
                // Try to construct the path for windows systems
                child_process.exec("cd dist/offline/ && ..\\..\\bin\\zip.com -r -0 redbean.com utils assets icp-bundle.js reveal.js reveal.css blood.css custom-style.css && ..\\..\\bin\\zip.com -0 redbean.com index.html", (err, stdout, stderr) => {
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
