let didRun = false;
let $stderrBuffer = '';
let $stdoutBuffer = '';
let rArgs = [];

const olog = console.log;
const oerr = console.error;
console.log = function (line) {
    olog('[WORKER]', ...arguments);
}

console.error = function (ch) {
    oerr('[WORKER]', ...arguments);
}

onconnect = function (e) {
    let port = e.ports[0];

    function endSession(reqID) {
        if ($stderrBuffer != '') {
            port.postMessage({ command: 'stderr', line: $stderrBuffer, id: reqID });
        }
        if ($stdoutBuffer != '') {
            port.postMessage({ command: 'stdout', line: $stdoutBuffer, id: reqID });
        }
    
        port.postMessage({ command: 'run-completed', id: reqID, args: rArgs });
        rArgs = [];
        didRun = false;
        $stdoutBuffer = '';
        $stderrBuffer = '';
    }
    
    function listener(event) {
        let request = event.data;
        if (request.command == 'session-ended' && didRun) {
            const reqID = request.id;
            endSession(reqID);
        } else if (request.command == 'run' && !didRun) {
            didRun = true;
            const reqID = request.id;
    
            $rt_putStdoutCustom = function (ch) {
                if (ch === 0xa) {
                    port.postMessage({ command: 'stdout', line: $stdoutBuffer, id: reqID });
                    $stdoutBuffer = '';
                } else {
                    $stdoutBuffer += String.fromCharCode(ch);
                }
            }
    
            $rt_putStderrCustom = function (ch) {
                if (ch === 0xa) {
                    port.postMessage({ command: 'stderr', line: $stderrBuffer, id: reqID });
                    $stderrBuffer = '';
                } else {
                    $stderrBuffer += String.fromCharCode(ch);
                }
            }
    
            $rt_last_run_args = [];
            let blob = new Blob([request.code], { type: 'application/javascript' });
            let URLObject = URL.createObjectURL(blob);
            // olog('CODE: ' + request.code);
            importScripts(URLObject);
            port.postMessage({ command: 'run-finished-setup', id: reqID });
    
            try {
                if (request.messagePosting) {
                    port.postMessage({ command: 'main-will-start', id: reqID });
                }
                main(request.args);
                rArgs = $rt_last_run_args.data.map((j) => j.toString());
                if (request.messagePosting) {
                    port.postMessage({ command: 'main-finished', id: reqID, args: rArgs });
                }
            } catch (EE) {
                if (EE instanceof Error) {
                    console.log('APPLICATION ERROR', EE);
                    $stderrBuffer += 'Application Terminated (' + EE.name + '): ' + EE.message;
                } else {
                    console.log('APPLICATION ERROR', EE);
                    $stderrBuffer += 'Application Terminated due to an internal Error.';
                }
            }
    
            URLObject = undefined;
            blob = undefined;
    
            // self.removeEventListener('message', listener)
            // if (!request.keepAlive) {
            endSession(reqID);
            // }
        }
        request = undefined;
    }

    port.onmessage = listener;
    port.start();
}