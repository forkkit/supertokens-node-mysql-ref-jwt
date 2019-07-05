function goToGithub() {
    window.open(
        'https://github.com/supertokens/supertokens-node-mysql-ref-jwt',
        '_blank'
    );
}

document.addEventListener("DOMContentLoaded", () => {
    function uncollapseInitial(node, title, currNav) {
        node.classList.remove("hide");
        currNav.children[0].innerHTML = title + '<span class="arrow rotate"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#565656" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg></span>';
    }

    function collapseInitial(node, title, currNav) {
        node.classList.add("hide");
        currNav.children[0].innerHTML = title + '<span class="arrow"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#565656" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg></span>'
    }

    function uncollapse(node, title, currNav) {
        node.classList.remove("hide");
        let arrow = currNav.children[0].children[0];
        arrow.classList.toggle("rotate");
    }

    function collapse(node, title, currNav) {
        node.classList.add("hide");
        let arrow = currNav.children[0].children[0];
        arrow.classList.toggle("rotate");
    }

    function isDescendant(parent, child) {
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    let navGroupElements = document.getElementsByClassName("navGroup subNavGroup");

    let activeItem = document.getElementsByClassName("navListItemActive")[0];

    for (let i = 0; i < navGroupElements.length; i++) {
        let currNav = navGroupElements[i];
        const title = currNav.children[0].innerText;
        const content = navGroupElements[i].childNodes[1];
        currNav.children[0].classList.add("collapsible");

        currNav.childNodes[0].addEventListener("click", function () {
            if (!content.classList.contains("hide")) {
                collapse(content, title, currNav);
            } else {
                uncollapse(content, title, currNav);
            }
        });

        if (isDescendant(currNav, activeItem)) {
            uncollapseInitial(content, title, currNav);
        } else {
            collapseInitial(content, title, currNav);
        }

    }

    let superTokensPrevButtons = document.getElementsByClassName("docs-prev");
    let superTokensNextButtons = document.getElementsByClassName("docs-next");
    Array.from(superTokensPrevButtons).forEach(element => {
        element.children[1].innerHTML = "Previous";
    });

    Array.from(superTokensNextButtons).forEach(element => {
        element.children[0].innerHTML = "Next";
    });

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

    let specialNotes = document.getElementsByClassName("specialNote");
    for (let i = 0; i < specialNotes.length; i++) {
        let text = " " + specialNotes[i].innerHTML.trim();
        let header = document.getElementsByClassName("fixedHeaderContainer")[0];
        let splittedCurrPath = window.location.pathname.split("/");
        let imgPath = ["", splittedCurrPath[1], "img", "star.png"].join("/");
        specialNotes[i].innerHTML = `
            <div style="border: 1px solid #6ab1fd; border-radius: 6px; width: 100%; padding: 20px; display: flex">
            <div style="margin-right: 20px;">
            <img src="` + imgPath + `" style="width: 15px"></img>
            </div>
            <div style="flex: 1"><span style="color: #6ab1fd">Note:</span>` + text + `</div></div>
        `;
    }

    let header = document.getElementsByClassName("fixedHeaderContainer")[0];
    let splittedCurrPath = window.location.pathname.split("/");
    let imgPath = ["", splittedCurrPath[1], "img", "githubFold.png"].join("/");
    header.innerHTML = `
    <div style="position: relative">
        ` + header.innerHTML + `
        <img 
            src="`+ imgPath + `"
            style="width: 50px; height: 50px; position: absolute; top: -8px; right: 0px; cursor: pointer"
            onClick="goToGithub()">
        </img>
    </div>
    `;

    let body = document.getElementsByTagName("body")[0];
    body.style.display = "block";
});
