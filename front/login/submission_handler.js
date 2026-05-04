/** @type {HTMLFormElement} */
const form = document.querySelector("form");

form.addEventListener("submit", async e => {
    e.preventDefault();

    const username = form.elements[0].value;
    const password = form.elements[1].value;
    const response = await fetch("/api/auth/login", {
        method: "POST",
        body: `username=${username}&password=${password}`
    });

    if (response.ok) {
        await new Promise(r => setTimeout(r, 500));
        window.location.assign("/");
        return;
    }

    alert(await response.text());
});
