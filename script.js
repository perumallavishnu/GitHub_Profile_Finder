document.getElementById('searchBtn').addEventListener('click', fetchGitHubProfile);
document.getElementById('searchInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') fetchGitHubProfile();
});

async function fetchGitHubProfile() {
    const username = document.getElementById('searchInput').value.trim();
    if (!username) {
        alert('Please enter a GitHub username!');
        return;
    }

    try {
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) throw new Error('User not found');
        const user = await userResponse.json();

        displayUserProfile(user);

        const reposResponse = await fetch(user.repos_url);
        const repos = await reposResponse.json();

        displayUserRepos(repos, username);

        // Fetch Achievements (public repos, stars, forks, contributions)
        displayUserAchievements(user, repos);
    } catch (error) {
        document.getElementById('profile-container').innerHTML = `
            <div class="error-container">
                <i class="bx bx-error"></i>
                <p>${error.message}</p>
            </div>
        `;
        document.getElementById('repo-container').innerHTML = '';
    }
}


function displayUserProfile(user) {
    const profileContainer = document.getElementById('profile-container');
    profileContainer.innerHTML = `
        <div class = "pc">
            <div class = "pp">
                <img src="${user.avatar_url}" alt="${user.login}">
                <h2>${user.name || user.login}</h2>
                <p>${user.bio || 'No bio available'}</p>
            </div>
            <div class = "pd">
                <p><strong>Followers | </strong> ${user.followers}</p>
                <p><strong>Following | </strong> ${user.following}</p>
                <p><strong>Public Repos | </strong> ${user.public_repos}</p>
                <a href="${user.html_url}" target="_blank"><i class='bx bxl-github'></i></a>
            </div>
        </div>
    `;
}

function displayUserAchievements(user, repos) {
    const profileContainer = document.getElementById('profile-container');
    
    // Count total stars and forks in repos
    let totalStars = 0;
    let totalForks = 0;
    repos.forEach(repo => {
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
    });

    profileContainer.innerHTML += `
        <div class="achievements">
            <h3>Achievements</h3>
            <div class="ach">
                <p><i class='bx bxs-star'></i> <strong>Total Stars: </strong>${totalStars}</p>
                <p><i class='bx bx-git-repo-forked'></i> <strong>Total Forks: </strong>${totalForks}</p>
                <p><i class='bx bxs-square-rounded' ></i> <strong>Contributions: </strong>${user.public_gists}</p>
            </div>
        </div>
    `;
}

function displayUserRepos(repos) {
    const repoContainer = document.getElementById('repo-container');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    repoContainer.innerHTML = ''; // Clear any existing content

    const MAX_REPOS = 6; // Limit to 6 repos initially
    const isMoreRepos = repos.length > MAX_REPOS;

    // Display the first 6 repos (or fewer if less than 6 repos available)
    repos.slice(0, MAX_REPOS).forEach((repo) => {
        const repoElement = document.createElement('div');
        repoElement.classList.add('repo');
        repoElement.innerHTML = `
            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
            <p>${repo.description || 'No description available'}</p>
        `;
        repoContainer.appendChild(repoElement);
    });

    // Show "View All" button if there are more than 6 repos
    if (isMoreRepos) {
        viewMoreBtn.style.display = 'block';
        viewMoreBtn.addEventListener('click', () => {
            // Clear existing repos and display all repos
            repoContainer.innerHTML = '';
            repos.forEach((repo) => {
                const repoElement = document.createElement('div');
                repoElement.classList.add('repo');
                repoElement.innerHTML = `
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                    <p>${repo.description || 'No description available'}</p>
                `;
                repoContainer.appendChild(repoElement);
            });
            viewMoreBtn.style.display = 'none'; // Hide the button after clicking
        });
    } else {
        viewMoreBtn.style.display = 'none'; // Hide button if repos ≤ 6
    }
}