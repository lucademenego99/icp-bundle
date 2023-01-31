import { interpret, getFirstState } from '@sosml/interpreter';

onmessage = async (e) => {
    try {
        const initialState = getFirstState();
        const interpretationResult = interpret(e.data.script, initialState);
        // CHeck for evaluation errors
        if (interpretationResult.evaluationErrored) {
            throw new Error(interpretationResult.error?.toString(interpretationResult.state));
        }

        // Check for warnings
        let warnings = "";
        for(let i = 0; i < interpretationResult.warnings.length; i++) {
            warnings += '[WARNING]: ' + interpretationResult.warnings[i] + "\n";
        }

        // Return the result
        postMessage({
            "debug": warnings + (warnings != "" ? "\n" : "") + interpretationResult.state.toString({stopId: initialState.id + 1})
        });
    } catch (e) {
        console.log(e);
        postMessage({
            "error": e
        });
    }
}
