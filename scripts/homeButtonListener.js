document.addEventListener("DOMContentLoaded", () => {
    let superTokensLinks = document.getElementsByTagName("a");
    Array.from(superTokensLinks).forEach(element => {
        let url = element.href;
        let splittedUrl = url.split("/");
        let path = splittedUrl.filter((x, i) => i >= 3).join("/");
        let base = splittedUrl.filter((x, i) => i < 3).join("/");
        let currLocation = window.location.origin;
        if (base === currLocation && splittedUrl.length === 5) {
            element.href = "https://supertokens.io";
            element.target = "_blank";
        }
    });


    function uncollapse(node, title, currNav) {
        node.classList.remove("hide");
        currNav.children[0].innerHTML = title + '<span class="arrow rotate"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#565656" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg></span>';
    }

    function collapse(node, title, currNav) {
        node.classList.add("hide");
        currNav.children[0].innerHTML = title + '<span class="arrow"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#565656" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg></span>'
    }

    let navGroupElements = document.getElementsByClassName("navGroup subNavGroup")

    for (let i = 0; i < navGroupElements.length; i++) {
        //   const element = array[i];
        let currNav = navGroupElements[i];
        const title = currNav.children[0].innerText;
        const content = navGroupElements[i].childNodes[1];
        currNav.children[0].classList.add("collapsible");
        
        
        collapse(content, title, currNav);
        currNav.childNodes[0].addEventListener("click", function () {
            if (!content.classList.contains("hide")) {
                collapse(content, title, currNav);
            } else {
                uncollapse(content, title, currNav);
            }
        });
 
    }

    // let superTokensPrevButtons = document.getElementsByClassName("docs-prev");
    // let superTokensNextButtons = document.getElementsByClassName("docs-next");
    // Array.from(superTokensPrevButtons).forEach(element => {
    //     element.children[1].innerHTML = "Previous";
    // });

    // Array.from(superTokensNextButtons).forEach(element => {
    //     element.children[0].innerHTML = "Next";
    // });
});