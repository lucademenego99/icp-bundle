import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let loadedSql = false;
let db;

const SQL = initSqlJs({
    locateFile: (file) => wasmUrl
}).then((SQL) => {
    db = new SQL.Database();
    loadedSql = true;
});


onmessage = async (e) => {
    try {
        if (!loadedSql) {
            await SQL;
        }
        const output = db.exec(e.data.script);
        postMessage({
            "result": output
        });
    } catch (e) {
        postMessage({
            "error": e
        });
    }
}




