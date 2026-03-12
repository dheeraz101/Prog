const feed = document.getElementById("feed")
const textBox = document.getElementById("text")
const linkBox = document.getElementById("link")
const publishBtn = document.getElementById("publish")
const POST_COOLDOWN = 10 * 60 * 1000 // 10 minutes

function getUser() {

    let name = localStorage.getItem("user")

    if (!name) {

        const animals = ["Wolf", "Falcon", "Tiger", "Lion", "Eagle"]
        const num = Math.floor(Math.random() * 1000)

        name = animals[Math.floor(Math.random() * animals.length)] + "_" + num

        localStorage.setItem("user", name)

    }

    return name
}

function updateTimes() {

    const times = document.querySelectorAll(".post-time")

    times.forEach(el => {

        const timestamp = parseInt(el.dataset.time)

        el.textContent = timeAgo(timestamp)

    })

}

function escapeHTML(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function loadPosts() {

    fetch("posts.json?v=" + Date.now())
        .then(res => res.json())
        .then(data => {

                feed.innerHTML = ""

                data.reverse().forEach(post => {

                            const div = document.createElement("div")

                            div.className = "post"

                            div.innerHTML = `
                                    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">

                                    <div class="font-semibold text-gray-900">
                                    ${post.user}
                                    </div>

                                    <p class="text-gray-700 mb-3 leading-relaxed">
                                    ${escapeHTML(post.text)}
                                    </p>

                                    ${post.link ? `
                                    <a href="${post.link}" target="_blank" class="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                                    <i class="ri-links-line"></i>
                                    view project
                                    </a>` : ""}

                                    <div class="text-xs text-gray-400 mt-3 flex items-center gap-1">
                                        <i class="ri-time-line text-gray-400 text-sm"></i>
                                        <span class="post-time" data-time="${post.time}">
                                        ${timeAgo(post.time)}
                                        </span>
                                    </div>

                                    </div>
                            `

                feed.appendChild(div)

            })

        })

}


const welcome = document.getElementById("welcome")
const closeWelcome = document.getElementById("closeWelcome")

const counter = document.getElementById("counter")

textBox.addEventListener("input", function(){

    const length = textBox.value.length

    counter.textContent = length + " / 300"

    counter.classList.remove("text-red-500","text-orange-500")

    if(length > 300){
        counter.classList.add("text-red-500")
    }
    else if(length >= 250){
        counter.classList.add("text-orange-500")
    }

    updateClearButton()

})

linkBox.addEventListener("input", updateClearButton)

textBox.addEventListener("keydown", function(e){

    if(e.ctrlKey && e.key === "Enter"){
        publishBtn.click()
    }

})

if(!localStorage.getItem("welcomeSeen")){
    welcome.classList.remove("hidden")
}

closeWelcome.onclick = function(){
    localStorage.setItem("welcomeSeen",true)
    welcome.classList.add("hidden")
}

function canPost() {

    const lastPost = localStorage.getItem("lastPostTime")

    if (!lastPost) return true

    const diff = Date.now() - parseInt(lastPost)

    return diff >= POST_COOLDOWN

}

function sanitizeLink(url){

    if(!url) return ""

    try {

        const parsed = new URL(url)

        if(parsed.protocol === "http:" || parsed.protocol === "https:"){
            return parsed.href
        }

    } catch(e){
        return ""
    }

    return ""

}

publishBtn.onclick = async function() {
    const text = textBox.value.trim();
    const link = linkBox.value.trim();
    const user = getUser();

    if (text.length < 5) { alert("Write something"); return; }

    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";

    try {
        const res = await fetch("/.netlify/functions/publish", {
            method: "POST",
            body: JSON.stringify({ user, text, link }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (res.status === 200) {
            // Prepend locally so user sees instant update
            const tempPosts = JSON.parse(localStorage.getItem("posts") || "[]");
            tempPosts.unshift(data.post);
            localStorage.setItem("posts", JSON.stringify(tempPosts));

            renderLocalPosts();

            textBox.value = "";
            linkBox.value = "";
            counter.textContent = "0 / 300";
        } else {
            alert("Error publishing post: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Error publishing post");
    }

    publishBtn.disabled = false;
    publishBtn.innerHTML = `<i class="ri-upload-cloud-line mr-1"></i> Publish Progress`;
};

textBox.addEventListener("input", function(){

    this.style.height = "0px"
    this.style.height = this.scrollHeight + "px"

})

const clearBtn = document.getElementById("clearBtn")

clearBtn.onclick = function(){

    textBox.value = ""
    linkBox.value = ""

    counter.textContent = "0 / 300"

    textBox.style.height = "auto"

}

function updateClearButton(){

    if(textBox.value.length === 0 && linkBox.value.length === 0){
        clearBtn.disabled = true
        clearBtn.classList.add("opacity-40")
    } else {
        clearBtn.disabled = false
        clearBtn.classList.remove("opacity-40")
    }

}

function timeAgo(timestamp){

    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60
    }

    for (let key in intervals) {

        const interval = Math.floor(seconds / intervals[key])

        if (interval >= 1) {
            return interval + " " + key + (interval > 1 ? "s" : "") + " ago"
        }

    }

    return "just now"
}

function renderLocalPosts() {

    const posts = JSON.parse(localStorage.getItem("posts")) || []

    feed.innerHTML = ""

    if(posts.length === 0){
        feed.innerHTML = `
        <div class="bg-white p-5 rounded-xl shadow-sm animate-pulse h-24"></div>
        <div class="bg-white p-5 rounded-xl shadow-sm animate-pulse h-24"></div>
        `
        return
    }

    posts.forEach(post => {

        const div = document.createElement("div")

        div.innerHTML = `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">

        <div class="font-semibold text-gray-900">
        ${post.user}
        </div>


        <p class="text-gray-700 mb-3 leading-relaxed">
        ${escapeHTML(post.text)}
        </p>

        ${post.link ? `
        <a href="${post.link}" target="_blank" class="text-blue-600 text-sm flex items-center gap-1 hover:underline">
        <i class="ri-links-line"></i>
        view project
        </a>` : ""}

        <div class="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <i class="ri-time-line text-gray-400 text-sm"></i>
            <span class="post-time" data-time="${post.time}">
            ${timeAgo(post.time)}
            </span>
        </div>

        </div>
        `

        feed.appendChild(div)

    })

}

window.addEventListener("load", () => {

    textBox.focus()

    loadPosts()

    renderLocalPosts()

})

setInterval(updateTimes, 60000)

loadPosts()