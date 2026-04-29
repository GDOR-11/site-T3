function createLink(text, href) {
    const a = document.createElement("a");
    a.innerText = text;
    a.href = href;
    return a;
}

fetch("/api/auth/getuser").then(response => response.text()).then(username => {
    if (username !== "") {
        document.getElementById("header-username").innerText = username;
        document.querySelector("div.dropdown-content > [href=\"/login\"]").innerText = "Trocar conta";
        document.querySelector("div.dropdown-content > [href=\"/register\"]").remove();
        document.querySelector("div.dropdown-content").append(createLink("Notas", "/notas"));
        document.querySelector("div.dropdown-content").append(createLink("Faltas", "/faltas"));
    }
});
