document.addEventListener("DOMContentLoaded", () => {
    let superTokensLinks = document.getElementsByTagName("a");
    Array.from(superTokensLinks).forEach(element => {
        let url = element.href;
        let splittedUrl = url.split("/");
        let path = splittedUrl.filter((x, i) => i >= 3).join("/");
        let base = splittedUrl.filter((x, i) => i < 3).join("/");
        let currLocation = window.location.origin;
        if (base === currLocation && path === "") {
            element.href = "https://supertokens.io";
            element.target = "_blank";
        }
    });
});
