/**
 * @param {string} item 
 * @param {string} texto 
 * @returns {HTMLTableRowElement}
 */
function create_tr(item, texto) {
    const tr = document.createElement("tr");

    const item_td = document.createElement("td");
    const item_textarea = document.createElement("textarea");
    item_textarea.required = true;
    item_textarea.rows = 1;
    item_textarea.innerText = item;
    item_td.append(item_textarea);

    const text_td = document.createElement("td");
    const text_textarea = document.createElement("textarea");
    text_textarea.required = true;
    text_textarea.rows = 3;
    text_textarea.innerText = texto;
    text_td.append(text_textarea);

    const trash_td = document.createElement("td");
    const trash_button = document.createElement("button");
    trash_button.className = "delete-button";
    const trash_img = document.createElement("img");
    trash_img.src = "/images/trash_bin.png";
    trash_button.append(trash_img);
    trash_td.append(trash_button);

    trash_button.addEventListener("click", () => {
        tr.remove();
    });

    tr.append(item_td, text_td, trash_td);
    return tr;
}


(async () => {
    /** @type {{ [materia: string]: { [item: string]: string } }} */
    const data = (await (await fetch("/api/db/get", {
        method: "POST",
        body: '{ "path": "info/materias" }'
    })).json()).content;

    const container = document.getElementById("content-container");
    if (Object.keys(data).length === 0) {
        container.innerText = "Nada ainda";
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

    const user = await (await fetch("/api/auth/getuser")).text();
    if (user !== "admin") return;

    const edit_button = document.getElementById("edit-button");
    edit_button.style.display = "block";
    edit_button.addEventListener("click", () => {
        document.getElementById("dialog1-form").reset();
    });

    const tbody = document.querySelector("tbody");

    document.getElementById("novo-item").addEventListener("click", () => {
        tbody.append(create_tr("item", "texto"));
    });
    document.getElementById("second-edit-button").addEventListener("click", () => {
        const materia = document.getElementById("materia").value;
        if (materia === "") return;

        if (!(materia in data)) {
            data[materia] = {
                "professor": "insira aqui o nome e o contato do professor",
                "sala": "insira aqui qual a sala dessa matéria",
                "observaçoes": "insira aqui observações gerais"
            };
        }

        tbody.innerHTML = "";
        for (const item in data[materia]) {
            tbody.append(create_tr(item, data[materia][item]));
        }

        document.getElementById("dialog2").showModal();
    });
    document.getElementById("finish-edit").addEventListener("click", async () => {
        const materia = document.getElementById("materia").value;

        data[materia] = {};
        for (const tr of tbody.children) {
            const item = tr.children[0].children[0].value;
            const text = tr.children[1].children[0].value;
            data[materia][item] = text;
        }
        if (Object.keys(data[materia]).length === 0) {
            delete data[materia];
        }

        await fetch("/api/db/edit", {
            method: "POST",
            body: JSON.stringify({
                path: "info/materias",
                content: data
            })
        });
        await new Promise(r => setTimeout(r, 500));

        window.location.reload();
    });
})();
