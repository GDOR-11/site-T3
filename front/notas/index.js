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
 * @returns {{ media_min: number, media_max: number, peso_total: number, ultima_prova: string | null }}
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
            media_max += 10;
        } else {
            media_min += nota;
            media_max += nota;
        }
        peso_total += peso;
    }
    media_max /= peso_total;
    media_min /= peso_total;
    ultima_prova ??= null;

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

    if (Boolean(info_teoria.ultima_prova) ^ Boolean(info_lab.ultima_prova)) {
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
