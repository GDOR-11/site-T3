/**
 * @typedef {{ num_aulas: number, faltas_just: number, faltas_injust: number }} Materia
 * @typedef {{ [materia: string]: Materia }} Data
 */

/**
 * @param {string} user
 * @param {boolean} [create=true]
 * @returns {Promise<Data>}
 */
async function get_data(user, create = true) {
    let response = await fetch("/api/db/get", {
        method: "POST",
        body: JSON.stringify({
            path: `faltas/${user}`
        })
    });
    if (response.ok) return JSON.parse((await response.json()).content);
    if (!create) {
        alert("Houve um erro");
        console.log(response);
        throw "Couldn't get OK response";
    }

    await fetch("/api/db/create", {
        method: "POST",
        body: JSON.stringify({
            path: `faltas/${user}`,
            content: "{}"
        })
    });
    return await get_data(user, false);
}

/**
 * @param {string} user
 * @param {Data} data
 * @returns {Promise<void>}
 */
async function set_data(user, data) {
    await fetch("/api/db/edit", {
        method: "POST",
        body: JSON.stringify({
            path: `faltas/${user}`,
            content: JSON.stringify(data)
        })
    });
}

(async () => {
    const user = await (await fetch("/api/auth/getuser")).text();
    if (user === "") window.location.assign("/login");

    const tbody = document.querySelector("tbody");

    const data = await get_data(user);
    for (const materia in data) {
        const faltas_injust = data[materia].faltas_injust;
        const faltas_total = data[materia].faltas_injust + data[materia].faltas_just;
        const limite_injust = Math.floor(0.15 * data[materia].num_aulas);
        const limite_total = Math.floor(0.25 * data[materia].num_aulas);

        const new_cell = (text, td = true) => {
            const cell = document.createElement(td ? "td": "th");
            const p = document.createElement("p");
            p.innerText = text;
            cell.append(p);
            return cell;
        }

        const tr = document.createElement("tr");
        const tds = [];
        tds.push(new_cell(materia, false));
        tds.push(new_cell(faltas_injust));
        tds.push(new_cell(limite_injust));
        tds.push(new_cell(faltas_total));
        tds.push(new_cell(limite_total));

        if (faltas_injust == limite_injust) {
            tds[1].className = "light-warning";
        } else if (faltas_injust > limite_injust) {
            tds[1].className = "heavy-warning";
        }
        if (faltas_total == limite_total) {
            tds[3].className = "light-warning";
        } else if (faltas_total > limite_total) {
            tds[3].className = "heavy-warning";
        }

        tr.append(...tds);
        tbody.append(tr);
    }

    /** @type {HTMLFormElement} */
    const form_adicionar_materia = document.getElementById("form_adicionar-materia");
    /** @type {HTMLFormElement} */
    const form_remover_materia = document.getElementById("form_remover-materia");
    /** @type {HTMLFormElement} */
    const form_registrar_faltas = document.getElementById("form_registrar-faltas");

    document.getElementById("adicionar-materia").addEventListener("click", () => {
        form_adicionar_materia.reset();
    });
    document.getElementById("remover-materia").addEventListener("click", () => {
        form_remover_materia.reset();
    });
    document.getElementById("registrar-faltas").addEventListener("click", () => {
        form_registrar_faltas.reset();
    });


    form_adicionar_materia.addEventListener("submit", async () => {
        const materia = form_adicionar_materia.elements[0].value;
        const num_aulas = form_adicionar_materia.elements[1].value;

        data[materia] = {
            num_aulas,
            faltas_just: 0,
            faltas_injust: 0
        };
        set_data(user, data);

        window.location.reload();
    });
    form_remover_materia.addEventListener("submit", async e => {
        const materia = form_remover_materia.elements[0].value;
        if (data[materia] === undefined) {
            alert("Matéria não existe");
            e.preventDefault();
            return;
        }

        delete data[materia];
        set_data(user, data);

        window.location.reload();
    });
    form_registrar_faltas.addEventListener("submit", async e => {
        const materia = form_registrar_faltas.elements[0].value;
        if (data[materia] === undefined) {
            alert("Matéria não existe");
            e.preventDefault();
            return;
        }

        const num_faltas = Number(form_registrar_faltas.elements[1].value);
        const justificadas = form_registrar_faltas.elements[2].checked;
        const field = justificadas ? "faltas_just" : "faltas_injust";

        if (data[materia][field] + num_faltas < 0) {
            alert("Impossível remover faltas que não existem");
            e.preventDefault();
            return;
        }

        data[materia][field] += num_faltas;
        await set_data(user, data);

        window.location.reload();
    });
})();
