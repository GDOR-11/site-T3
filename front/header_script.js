const username = await (await fetch("/api/auth/getuser")).text();

if (username !== "") {
    document.getElementById("unauthenticated-auth-section").style.display = "none";
    document.getElementById("authenticated-auth-section").style.display = "flex";
    document.getElementById("header-username").innerText = username;
}
