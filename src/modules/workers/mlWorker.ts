import { interpret, getFirstState } from '@sosml/interpreter';

onmessage = async (e) => {
    try {
        let interpretationResult;
        let result = "";
        const initialState = getFirstState();

        // Split the script: each instruction is delimited by a ;
        const script = e.data.script.split(';');

        // Interpret the script
        for(let i = 0; i < script.length-1; i++) {
            script[i] += ";";
            interpretationResult = interpret(script[i], i == 0 ? initialState : interpretationResult.state);
            // CHeck for evaluation errors
            if (interpretationResult.evaluationErrored) {
                throw new Error(interpretationResult.error?.toString(interpretationResult.state));
            }

            // Check for warnings
            let warnings = "";
            for(let i = 0; i < interpretationResult.warnings.length; i++) {
                warnings += '[WARNING]: ' + interpretationResult.warnings[i] + "\n";
            }

            result += warnings + (warnings != "" ? "\n" : "") + interpretationResult.state.toString({stopId: interpretationResult.state.id});
        }

        // Return the result
        postMessage({
            "debug": result
        });
    } catch (e) {
        console.log(e);
        postMessage({
            "error": e
        });
    }
}
