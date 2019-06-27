let links = document.getElementsByTagName("a");
Array.from(links).forEach(element => {
    console.log(element.href);
});