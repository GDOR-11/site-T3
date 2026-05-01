(async () => {
    /** @type {{ [materia: string]: { [item: string]: string } }} */
    const data = (await (await fetch("/api/db/get", {
        method: "POST",
        body: '{ "path": "info/materias" }'
    })).json()).content;

    const container = document.getElementById("content-container");
    if (Object.keys(data).length === 0) {
        container.innerText = "O RD é omisso e ainda não colocou nada aqui";
        return;
    }

    for (const materia in data) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.innerText = materia;

        const ul = document.createElement("ul");
        for (const item in data[materia]) {
            const li = document.createElement("li");
            li.innerText = `${item}: ${data[materia][item]}`;
            ul.append(li);
        }
        details.append(summary, ul);
        container.append(details);
    }
})();
