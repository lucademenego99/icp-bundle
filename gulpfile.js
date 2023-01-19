import del from 'del';
import child_process from 'child_process';
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// Check the language argument
const args = yargs(hideBin(process.argv)).argv;
if (args["language"] == undefined) {
    // If the language argument is not specified, print the help message
    console.log("Please specify a language to build the project for. For example, to build the project for python, use the following command:");
    console.log("\tnpm run build -- --language python\n");
    console.log("To build the project for all languages, use the following command:");
    console.log("\tnpm run build -- --language full\n");
    console.log("If you want to run python or java in offline mode, use the following command:");
    console.log("\tnpm run build -- --language ${language}-offline\n");
    console.log("The other languages instead already work in offline mode even when built normally.\n");
    process.exit(1);
}
const language = args["language"] == "p5" || args["language"] == "processing" ? "p5-and-processing" : args["language"];

/**
 * Cleanup function - delete some files that are not needed and print some messages
 */
function cleanup(cb) {
    console.log("Deleting some files...");
    del(['dist/base/index.html']);

    console.log("Finished!");
    if (language == "full-offline") {
        console.log("If you want to set up a single-file distributable web server, use dist/base/redbean.com and check the icp-create-server repository");
    }
    console.log(`If you want to use the library and deploy to a server, all you need is the generated dist/base/${language}.iife.js\n`);
    cb();
}

/**
 * Main task - build the project for the specified language
 */
export default (cb) => {
    console.log(`Building the project for '${language}' - this may take a while...`);
    
    child_process.exec(`vite build -c=build-config/vite.${language}.js`, (err, stdout, stderr) => {
        if (err) {
            console.log("[ERROR] building the project");
            cb(err);
        }

        // Replace "use strict"; with "use strict";\nglobalThis.process = globalThis.process;\n
        // This is because the p5-and-processing library uses process, which is undefined in the browser
        // This is a hacky way to fix it
        console.log("Replacing process with globalThis.process");
        child_process.exec(`sed -i 's/\"use strict\";/\"use strict\";\\nglobalThis.process = globalThis.process;\\n/g' dist/base/${language}.iife.js`, (err, stdout, stderr) => {
            if (err) {
                console.log("[ERROR] replacing process with globalThis.process");
                cb(err);
            }
        });

        console.log("Build completed!");

        if (language == "java-offline") {
            // Copy some files for Java to work offline
            console.log("Setting up java offline mode.")
            child_process.exec("cp src/modules/workers/java/javaWorker.ts dist/base/utils/java/javaWorker.js", (err, stdout, stderr) => {
                if (err) {
                    console.log("[ERROR] moving javaWorker.ts to javaWorker.js");
                    cb(err);
                }
            });
            child_process.exec("cp src/modules/workers/java/javaTeaWorkerOffline.ts dist/base/utils/java/javaTeaWorker.js", (err, stdout, stderr) => {
                if (err) {
                    console.log("[ERROR] moving javaTeaWorkerOffline.ts to javaTeaWorker.js");
                    cb(err);
                }
            });
            child_process.exec("cp src/modules/workers/java/javaRunWorker.ts dist/base/utils/java/javaRunWorker.js", (err, stdout, stderr) => {
                if (err) {
                    console.log("[ERROR] moving javaRunWorker.ts to javaRunWorker.js");
                    cb(err);
                }
            });
        }

        if (language == "full-offline") {
            console.log("Setting up redbean.com for full offline mode.")
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
        } else {
            cleanup(cb);
        }
    });
}
