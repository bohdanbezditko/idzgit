const usernameInput = document.getElementById("usernameInput");
const searchBtn = document.getElementById("searchBtn");
const reposList = document.getElementById("reposList");
const repoDetails = document.getElementById("repoDetails");
const commitsList = document.getElementById("commitsList");
const errorBlock = document.getElementById("error");

searchBtn.addEventListener("click", loadRepositories);

usernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        loadRepositories();
    }
});

async function loadRepositories() {
    const username = usernameInput.value.trim();

    if (username === "") {
        showError("Введіть ім'я користувача GitHub.");
        return;
    }

    clearPage();

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);

        if (!response.ok) {
            throw new Error("Користувача не знайдено або сталася помилка запиту.");
        }

        const repos = await response.json();

        if (repos.length === 0) {
            reposList.innerHTML = "<p>У користувача немає публічних репозиторіїв.</p>";
            return;
        }

        repos.forEach((repo) => {
            const repoItem = document.createElement("div");
            repoItem.className = "repo-item";

            repoItem.innerHTML = `
                <div class="repo-title">${repo.name}</div>
                <div class="repo-description">${repo.description || "Опис відсутній"}</div>
            `;

            repoItem.addEventListener("click", () => {
                loadRepositoryDetails(username, repo.name);
            });

            reposList.appendChild(repoItem);
        });

    } catch (error) {
        showError(error.message);
    }
}

async function loadRepositoryDetails(username, repoName) {
    repoDetails.innerHTML = "<p>Завантаження...</p>";
    commitsList.innerHTML = "";

    try {
        const repoResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
        const languagesResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/languages`);
        const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/commits?per_page=10`);

        if (!repoResponse.ok || !languagesResponse.ok || !commitsResponse.ok) {
            throw new Error("Не вдалося завантажити дані репозиторію.");
        }

        const repo = await repoResponse.json();
        const languages = await languagesResponse.json();
        const commits = await commitsResponse.json();

        const languagesText = Object.keys(languages).length > 0
            ? Object.keys(languages).join(", ")
            : "Не вказано";

        repoDetails.innerHTML = `
            <div class="detail-row"><strong>Назва:</strong> ${repo.name}</div>
            <div class="detail-row"><strong>Опис:</strong> ${repo.description || "Опис відсутній"}</div>
            <div class="detail-row"><strong>URL:</strong> <a href="${repo.html_url}" target="_blank">${repo.html_url}</a></div>
            <div class="detail-row"><strong>Дата створення:</strong> ${formatDate(repo.created_at)}</div>
            <div class="detail-row"><strong>Оновлено:</strong> ${formatDate(repo.updated_at)}</div>
            <div class="detail-row"><strong>Мови:</strong> ${languagesText}</div>
        `;

        if (commits.length === 0) {
            commitsList.innerHTML = "<p>Комітів не знайдено.</p>";
            return;
        }

        commits.forEach((commit) => {
            const commitItem = document.createElement("div");
            commitItem.className = "commit-item";

            commitItem.innerHTML = `
                <div><strong>Дата:</strong> ${formatDate(commit.commit.author.date)}</div>
                <div><strong>Хеш:</strong> <span class="commit-hash">${commit.sha.substring(0, 10)}</span></div>
                <div><strong>Повідомлення:</strong> ${commit.commit.message}</div>
            `;

            commitsList.appendChild(commitItem);
        });

    } catch (error) {
        repoDetails.innerHTML = "";
        commitsList.innerHTML = "";
        showError(error.message);
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString("uk-UA");
}

function showError(message) {
    errorBlock.textContent = message;
}

function clearPage() {
    errorBlock.textContent = "";
    reposList.innerHTML = "";
    repoDetails.innerHTML = "<p>Оберіть репозиторій зі списку.</p>";
    commitsList.innerHTML = "";
}