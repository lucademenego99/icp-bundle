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

function endSession(reqID) {
    if ($stderrBuffer != '') {
        self.postMessage({ command: 'stderr', line: $stderrBuffer, id: reqID });
    }
    if ($stdoutBuffer != '') {
        self.postMessage({ command: 'stdout', line: $stdoutBuffer, id: reqID });
    }

    $stderrBuffer = undefined;
    $stdoutBuffer = undefined;

    self.postMessage({ command: 'run-completed', id: reqID, args: rArgs });
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
                self.postMessage({ command: 'stdout', line: $stdoutBuffer, id: reqID });
                $stdoutBuffer = '';
            } else {
                $stdoutBuffer += String.fromCharCode(ch);
            }
        }

        $rt_putStderrCustom = function (ch) {
            if (ch === 0xa) {
                self.postMessage({ command: 'stderr', line: $stderrBuffer, id: reqID });
                $stderrBuffer = '';
            } else {
                $stderrBuffer += String.fromCharCode(ch);
            }
        }

        $rt_last_run_args = [];
        let blob = new Blob([request.code], { type: 'application/javascript' });
        let URLObject = URL.createObjectURL(blob);
        olog('CODE: ' + request.code);
        self.importScripts(URLObject);
        self.postMessage({ command: 'run-finished-setup', id: reqID });

        try {
            if (request.messagePosting) {
                self.postMessage({ command: 'main-will-start', id: reqID });
            }
            main(request.args);
            rArgs = $rt_last_run_args.data.map((j) => j.toString());
            if (request.messagePosting) {
                self.postMessage({ command: 'main-finished', id: reqID, args: rArgs });
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

onmessage = listener;