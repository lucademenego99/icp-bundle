import { interpret, getFirstState, Errors } from '@sosml/interpreter';

enum ErrorType {
    OK = 0, // Interpret successful
    INCOMPLETE, // The given partial string was incomplete SML code
    INTERPRETER, // The interpreter failed, e.g. compile error etc.
    SML // SML raised an exception
}

/**
 * Evaluate a partial or complete SML string
 * @param oldState previous state
 * @param partial partial or complete SML string
 * @returns result of the evaluation
 */
function evaluate(oldState: any, partial: string) {
    let ret;
    try {
        ret = interpret(partial + ';', oldState);
    } catch (e) {
        if (e instanceof Errors.IncompleteError) {
            return {
                state: null,
                result: ErrorType.INCOMPLETE,
                error: e,
                warnings: []
            };
        } else {
            return {
                state: null,
                result: ErrorType.INTERPRETER,
                error: e,
                warnings: []
            };
        }
    }
    if (ret.evaluationErrored) {
        return {
            state: ret.state,
            result: ErrorType.SML,
            error: ret.error,
            warnings: ret.warnings
        };
    } else {
        return {
            state: ret.state,
            result: ErrorType.OK,
            error: null,
            warnings: ret.warnings
        };
    }
}

onmessage = async (e) => {
    try {
        let interpretationResult;
        let result = "";
        const initialState = getFirstState();

        // Add trunc
        interpretationResult = interpret("fun trunc x = if x >= 0.0 then floor x else ceil x;", initialState);
        const startingId = interpretationResult.state.id + 1;

        // Split the script: each instruction is delimited by a ;
        const script = e.data.script.split(';');

        // Interpret the script
        for(let i = 0; i < script.length-1; i++) {
            script[i] += ";";
            const res = evaluate(interpretationResult.state, script[i]);

            if (res.result == ErrorType.OK) {
                interpretationResult = res;
                // Check for warnings
                let warnings = "";
                for(let i = 0; i < res.warnings.length; i++) {
                    warnings += res.warnings[i];
                }

                result += warnings + (warnings != "" ? "\n" : "") + res.state.toString({stopId: res.state.id});
            } else if (res.result == ErrorType.INCOMPLETE) {
                if (i < script.length - 2) {
                    script[i+1] = script[i] + script[i+1];
                } else {
                    throw new Error(res.error);
                }
            } else {
                throw new Error(res.error);
            }
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
