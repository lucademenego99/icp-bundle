import { interpret, getFirstState } from '@sosml/interpreter';

onmessage = async (e) => {
    try {
        const initialState = getFirstState();
        const interpretationResult = interpret(e.data.script, initialState);
        postMessage({
            "debug": interpretationResult.state.toString({stopId: initialState.id + 1})
        });
    } catch (e) {
        postMessage({
            "error": e
        });
    }
}
