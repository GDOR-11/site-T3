/** @typedef {{ peso: number, nota: number }} Prova */
/** @typedef {{ tipo: "simples", provas: { [prova: string]: Prova } }} MateriaSimples */
/** @typedef {{ provas: { [prova: string]: Prova } }} Submateria */
/** @typedef {{ tipo: "composta", teoria: Submateria, lab: Submateria, media: "aritmetica" | "geometrica" }} MateriaComposta */
/** @typedef {MateriaSimples | MateriaComposta} Materia */
/** @typedef {{ [materia: string]: Materia }} Data */

/**
 * @param {string} user
 * @param {boolean} [create=true]
 * @returns {Promise<Data>}
 */
async function get_data(user, create = true) {
    const response = await fetch("/api/db/get", {
        method: "POST",
        body: `{ "path": "notas/${user}" }`
    });

    if (response.ok) return (await response.json()).content;

    if (!create) {
        alert("Houve um erro");
        console.log(response);
        throw "Couldn't get OK response";
    }

    await fetch("/api/db/create", {
        method: "POST",
        body: `{ "path": "notas/${user}", "content": "{}" }`
    });

    return await get_data(user, false);
}

/**
 * @param {string} user 
 * @param {Data} data 
 */
async function set_data(user, data) {
    await fetch("/api/db/edit", {
        method: "POST",
        body: JSON.stringify({
            path: `notas/${user}`,
            content: data
        })
    });
}

/**
 * @param {number} nota
 * @param {boolean} [round_up=false]
 * @returns {string}
 */
function nota_toString(nota, round_up = false) {
    if (round_up) {
        return (Math.ceil(10 * nota) / 10).toString().replace(".", ",");
    } else {
        return (Math.floor(10 * nota) / 10).toString().replace(".", ",");
    }
}

/**
 * @param {{ [prova: string]: Prova }} provas 
 * @returns {{ media_min: number, media_max: number, peso_total: number, ultima_prova: string | null | undefined }}
 */
function informacoes_provas(provas) {
    let peso_total = 0;
    let media_min = 0;
    let media_max = 0;
    let ultima_prova;
    for (const prova in provas) {
        const nota = provas[prova].nota;
        const peso = provas[prova].peso;

        if (nota === -1) {
            if (ultima_prova === undefined) {
                ultima_prova = prova;
            } else {
                ultima_prova = null;
            }
            media_max += peso * 10;
        } else {
            media_min += peso * nota;
            media_max += peso * nota;
        }
        peso_total += peso;
    }
    media_max /= peso_total;
    media_min /= peso_total;

    return { media_min, media_max, peso_total, ultima_prova };
}

/**
 * @param {string} materia
 * @param {MateriaSimples} dados 
 * @returns {HTMLDivElement}
 */
function div_materia_simples(materia, dados) {
    const div = document.createElement("div");
    div.className = "materia materia-simples";

    const titulo = document.createElement("h1");
    titulo.innerText = materia;
    titulo.className = "titulo-materia";
    div.append(titulo);

    const ul = document.createElement("ul");
    ul.className = "lista-notas";
    div.append(ul);

    for (const prova in dados.provas) {
        let nota = dados.provas[prova].nota;
        if (nota === -1) nota = "?";
        const peso = dados.provas[prova].peso;

        const li = document.createElement("li");
        li.className = "nota";
        li.innerText = `${prova}: ${nota} (peso ${peso})`;
        ul.append(li);
    }

    const { media_min, media_max, peso_total, ultima_prova } = informacoes_provas(dados.provas);
    if (peso_total === 0) return div;

    const p_media_min = document.createElement("p");
    p_media_min.className = "media";
    p_media_min.innerText = `Média mínima: ${nota_toString(media_min)}`;
    const p_media_max = document.createElement("p");
    p_media_max.className = "media";
    p_media_max.innerText = `Média máxima: ${nota_toString(media_max)}`;
    div.append(p_media_min, p_media_max);

    if (ultima_prova) {
        const nota_necessaria = x => (x - media_min) * peso_total / dados.provas[ultima_prova].peso;
        const nota_50 = document.createElement("p");
        nota_50.className = "nota-necessaria";
        nota_50.innerText = "Nota necessára para média 5,0: ";
        nota_50.innerText += nota_toString(nota_necessaria(5), true);
        const nota_65 = document.createElement("p");
        nota_65.className = "nota-necessaria";
        nota_65.innerText = "Nota necessára para média 6,5: ";
        nota_65.innerText += nota_toString(nota_necessaria(6.5), true);
        div.append(nota_50, nota_65);
    }

    return div;
}

/**
 * @param {string} submateria
 * @param {Submateria} dados 
 * @returns {HTMLDivElement}
 */
function div_submateria(submateria, dados) {
    const div = document.createElement("div");
    div.className = "submateria";

    const title = document.createElement("h1");
    title.className = "titulo-submateria";
    title.innerText = submateria;
    div.append(title);

    const ul = document.createElement("ul");
    ul.className = "lista-notas";
    div.append(ul);
    for (const prova in dados.provas) {
        let nota = dados.provas[prova].nota;
        const peso = dados.provas[prova].peso;
        if (nota === -1) nota = "?";

        const li = document.createElement("li");
        li.className = "nota";
        li.innerText = `${prova}: ${nota} (peso ${peso})`;
        ul.append(li);
    }

    return div;
}

/**
 * @param {string} materia
 * @param {MateriaComposta} dados
 * @returns {HTMLDivElement}
 */
function div_materia_composta(materia, dados) {
    const div = document.createElement("div");
    div.className = "materia materia-composta";

    const titulo = document.createElement("h1");
    titulo.className = "titulo-materia";
    titulo.innerText = materia;
    div.append(titulo);

    div.append(div_submateria(materia + " teoria", dados.teoria));
    div.append(div_submateria(materia + " lab", dados.lab));

    const info_teoria = informacoes_provas(dados.teoria.provas);
    const info_lab = informacoes_provas(dados.lab.provas);
    if (info_teoria.peso_total === 0 || info_lab.peso_total === 0) return div;

    const media_min = dados.media === "aritmetica" ?
        (info_teoria.media_min + info_lab.media_min) / 2 :
        Math.sqrt(info_teoria.media_min * info_lab.media_min);
    const media_max = dados.media === "aritmetica" ?
        (info_teoria.media_max + info_lab.media_max) / 2 :
        Math.sqrt(info_teoria.media_max * info_lab.media_max);

    const p_media_min = document.createElement("p");
    p_media_min.className = "media";
    p_media_min.innerText = `Média mínima: ${nota_toString(media_min)}`;
    const p_media_max = document.createElement("p");
    p_media_max.className = "media";
    p_media_max.innerText = `Média máxima: ${nota_toString(media_max)}`;
    div.append(p_media_min, p_media_max);

    if (info_teoria.ultima_prova === undefined && info_lab.ultima_prova ||
        info_lab.ultima_prova === undefined && info_teoria.ultima_prova) {
        const ultima_prova = info_teoria.ultima_prova || info_lab.ultima_prova;
        const prova = ultima_prova === info_teoria.ultima_prova ?
            dados.teoria.provas[ultima_prova] :
            dados.lab.provas[ultima_prova];
        const info = ultima_prova === info_teoria.ultima_prova ? info_teoria : info_lab;
        const outra_media = ultima_prova === info_teoria.ultima_prova ? info_lab.media_min : info_teoria.media_min;

        const nota_necessaria = dados.media === "aritmetica" ?
            x => (2 * x - outra_media - info.media_min) * info.peso_total / prova.peso :
            x => (x * x / outra_media - info.media_min) * info.peso_total / prova.peso;

        const nota_50 = document.createElement("p");
        nota_50.className = "nota-necessaria";
        nota_50.innerText = "Nota necessára para média 5,0: ";
        nota_50.innerText += nota_toString(nota_necessaria(5), true);
        const nota_65 = document.createElement("p");
        nota_65.className = "nota-necessaria";
        nota_65.innerText = "Nota necessára para média 6,5: ";
        nota_65.innerText += nota_toString(nota_necessaria(6.5), true);
        div.append(nota_50, nota_65);
    }

    return div;
}

/**
 * @param {string} materia
 * @param {Materia} dados
 * @returns {HTMLDivElement}
 */
function div_materia(materia, dados) {
    return dados.tipo === "simples" ?
        div_materia_simples(materia, dados) :
        div_materia_composta(materia, dados);
}

const user = await(await fetch("/api/auth/getuser")).text();
if (user === "") {
    window.location.assign("/login");
}

const data = await get_data(user);

const container = document.getElementById("container-materias");

for (const materia in data) {
    container.append(div_materia(materia, data[materia]));
}



const select_remover_materia = document.getElementById("select-remover-materia");
const select_editar_notas_1 = document.getElementById("select-editar-notas-1");
for (const materia in data) {
    const option = document.createElement("option");
    option.value = option.innerText = materia;
    select_remover_materia.append(option);

    if (data[materia].tipo === "simples") {
        select_editar_notas_1.append(option.cloneNode(true));
    } else {
        const option1 = document.createElement("option");
        const option2 = document.createElement("option");
        option1.innerText = materia + " teoria";
        option1.value = materia + "\\teoria";
        option2.innerText = materia + " lab";
        option2.value = materia + "\\lab"
        select_editar_notas_1.append(option1, option2);
    }
}
document.getElementById("botao-remover-materia").addEventListener("click", async () => {
    const materia = select_remover_materia.value;
    delete data[materia];
    await set_data(user, data);
    window.location.reload();
});

document.getElementById("adicionar-materia").addEventListener("click", () => {
    document.getElementById("form-adicionar-materia").reset();
    document.getElementById("adicionar-materia_media-container").style.display = "none";
});

const adicionar_materia__lab = document.getElementById("adicionar-materia_lab");
document.getElementById("adicionar-materia_lab").addEventListener("input", function() {
    document.getElementById("adicionar-materia_media-container").style.display = this.checked ? "flex" : "none";
});

document.getElementById("botao-adicionar-materia").addEventListener("click", async e => {
    const materia = document.getElementById("adicionar-materia_materia").value;
    if (data[materia] !== undefined) {
        e.preventDefault();
        alert("matéria já existe!");
        return;
    }
    const lab = document.getElementById("adicionar-materia_lab").checked;
    if (lab) {
        data[materia] = {
            tipo: "composta",
            media: document.getElementById("adicionar-materia_media").value,
            lab: { provas: {} },
            teoria: { provas: {} }
        };
    } else {
        data[materia] = {
            tipo: "simples",
            provas: {}
        };
    }
    await set_data(user, data);
    window.location.reload();
});


const tbody = document.querySelector("tbody");
document.getElementById("botao-editar-notas-1").addEventListener("click", () => {
    document.getElementById("dialog-editar-notas-2").showModal();
    const value = document.getElementById("select-editar-notas-1").value;
    const materia = value.split("\\")[0];
    const submateria = value.split("\\")[1];
    const provas = data[materia].tipo === "simples" ? data[materia].provas : data[materia][submateria].provas;

    tbody.innerHTML = "";
    for (const prova in provas) {
        let nota = provas[prova].nota.toString();
        if (nota === "-1") nota = "";
        tbody.append(create_tr(prova, nota, provas[prova].peso.toString()));
    }
});
document.getElementById("botao-editar-notas-2").addEventListener("click", async () => {
    document.getElementById("dialog-editar-notas-2").showModal();
    const value = document.getElementById("select-editar-notas-1").value;
    const materia = value.split("\\")[0];
    const submateria = value.split("\\")[1];
    const provas = data[materia].tipo === "simples" ? data[materia].provas : data[materia][submateria].provas;
    for (const prova in provas) delete provas[prova];

    for (const tr of tbody.children) {
        const prova = tr.children[0].children[0].value;
        const nota  = Number(tr.children[1].children[0].value || "-1");
        const peso  = Number(tr.children[2].children[0].value);

        provas[prova] = { nota, peso };
    }

    await set_data(user, data);
    window.location.reload();
});
document.getElementById("novo-item").addEventListener("click", () => {
    tbody.append(create_tr("", "", "1"));
});

/**
 * @param {string} prova
 * @param {string} nota
 * @param {string} peso
 * @returns {HTMLTableRowElement}
 */
function create_tr(prova, nota, peso) {
    const tr = document.createElement("tr");

    const prova_td = document.createElement("td");
    const prova_input = document.createElement("input");
    prova_input.required = true;
    prova_input.value = prova;
    prova_td.append(prova_input);

    const nota_td = document.createElement("td");
    const nota_input = document.createElement("input");
    nota_input.value = nota;
    nota_input.type = "number";
    nota_input.min = 0;
    nota_input.max = 10;
    nota_input.step = "any";
    nota_td.append(nota_input);

    const peso_td = document.createElement("td");
    const peso_input = document.createElement("input");
    peso_input.required = true;
    peso_input.value = peso;
    peso_input.type = "number";
    peso_input.min = 0;
    peso_input.step = "any";
    peso_td.append(peso_input);

    const trash_td = document.createElement("td");
    const trash_button = document.createElement("button");
    trash_button.type = "button";
    trash_button.className = "delete-button";
    const trash_img = document.createElement("img");
    trash_img.src = "/images/trash_bin.png";
    trash_button.append(trash_img);
    trash_td.append(trash_button);

    trash_button.addEventListener("click", () => {
        tr.remove();
    });

    tr.append(prova_td, nota_td, peso_td, trash_td);
    return tr;
}
