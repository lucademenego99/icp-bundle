type Table = {
    columns: string[];
    values: any[][];
};

/**
 * Create an HTML table from the output of a SQL.js query
 * Only used when language == "sql"
 * @param output The output of the SQLWorker
 */
function createHTMLTable(output: Table) {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    table.appendChild(thead);
    table.appendChild(tbody);
    const tr = document.createElement("tr");
    thead.appendChild(tr);
    output.columns.forEach((column) => {
        const th = document.createElement("th");
        th.textContent = column;
        tr.appendChild(th);
    });
    output.values.forEach((row) => {
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        row.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });
    });
    return table;
}


export {
    createHTMLTable,
}