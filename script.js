// Event Listeners
document.getElementById('searchBtn').addEventListener('click', fetchGitHubProfile);
document.getElementById('searchInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') fetchGitHubProfile();
});
document.getElementById('searchInput').addEventListener('input', fetchUserSuggestions);

// Fetch User Suggestions
async function fetchUserSuggestions() {
    const query = document.getElementById('searchInput').value.trim();
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';

    if (query.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
        const data = await response.json();
        const users = data.items || [];
        displaySuggestions(users);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        suggestionsContainer.style.display = 'none';
    }
}

// Display Suggestions with Profile Pictures
function displaySuggestions(users) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';

    if (users.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    users.forEach(user => {
        const suggestion = document.createElement('div');
        suggestion.classList.add('suggestion-item');
        suggestion.innerHTML = `
            <img src="${user.avatar_url}" alt="${user.login}">
            <span>${user.login}</span>
        `;
        suggestion.addEventListener('click', () => {
            document.getElementById('searchInput').value = user.login;
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            fetchGitHubProfile();
        });
        suggestionsContainer.appendChild(suggestion);
    });

    suggestionsContainer.style.display = 'block';
}

// Fetch GitHub Profile and Repositories
async function fetchGitHubProfile() {
    const username = document.getElementById('searchInput').value.trim();
    const suggestionsContainer = document.getElementById('suggestions-container');

    if (!username) {
        alert('Please enter a GitHub username!');
        return;
    }

    try {
        // Hide suggestions
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';

        // Fetch user profile data
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) throw new Error('User not found');
        const user = await userResponse.json();

        // Display user profile
        displayUserProfile(user);

        // Fetch repositories
        const reposResponse = await fetch(user.repos_url);
        const repos = await reposResponse.json();

        // Display repositories
        displayUserRepos(repos, username);

        // Display achievements
        displayUserAchievements(user, repos);
    } catch (error) {
        displayError(error.message);
    }
}

// Display User Profile
function displayUserProfile(user) {
    const profileContainer = document.getElementById('profile-container');
    profileContainer.innerHTML = `
        <div class="pc">
            <div class="pp">
                <img src="${user.avatar_url}" alt="${user.login}">
                <h2>${user.name || user.login}</h2>
                <p>${user.bio || 'No bio available'}</p>
            </div>
            <div class="pd">
                <p><strong>Followers | </strong> ${user.followers}</p>
                <p><strong>Following | </strong> ${user.following}</p>
                <p><strong>Public Repos | </strong> ${user.public_repos}</p>
                <a href="${user.html_url}" target="_blank"><i class='bx bxl-github'></i></a>
            </div>
        </div>
    `;
}

// Display User Achievements
function displayUserAchievements(user, repos) {
    const profileContainer = document.getElementById('profile-container');

    // Calculate total stars and forks
    let totalStars = 0;
    let totalForks = 0;
    repos.forEach(repo => {
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
    });

    // Fetch most used language for each repo (optional enhancement)
    // For simplicity, we'll display the most used language across all repos
    const languageCount = {};
    repos.forEach(repo => {
        if (repo.language) {
            languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
        }
    });

    let mostUsedLanguage = 'N/A';
    if (Object.keys(languageCount).length > 0) {
        mostUsedLanguage = Object.keys(languageCount).reduce((a, b) => languageCount[a] > languageCount[b] ? a : b);
    }

    profileContainer.innerHTML += `
        <div class="achievements">
            <h3>Achievements</h3>
            <div class="ach">
                <p><i class='bx bxs-star'></i> <strong>Total Stars:</strong> ${totalStars}</p>
                <p><i class='bx bx-git-repo-forked'></i> <strong>Total Forks:</strong> ${totalForks}</p>
                <p><i class='bx bxs-pie-chart-alt-2'></i> <strong>Most Used Language:</strong> ${mostUsedLanguage}</p>
            </div>
        </div>
    `;
}

// Display User Repositories
function displayUserRepos(repos, username) {
    const repoContainer = document.getElementById('repo-container');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    repoContainer.innerHTML = '';

    const MAX_REPOS = 6;
    const isMoreRepos = repos.length > MAX_REPOS;

    // Function to create repo cards with additional details
    const createRepoCard = (repo) => {
        const repoElement = document.createElement('div');
        repoElement.classList.add('repo');
        repoElement.innerHTML = `
            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
            <p>${repo.description || 'No description available'}</p>
            <div class="repo-details">
                <div>
                    <i class='bx bx-code-branch'></i>
                    <span>${repo.branches_count || 0} branches</span>
                </div>
                <div>
                    <i class='bx bx-palette'></i>
                    <span>${repo.language || 'N/A'}</span>
                </div>
                <div>
                    <i class='bx bxs-star'></i>
                    <span>${repo.stargazers_count} stars</span>
                </div>
            </div>
        `;
        return repoElement;
    };

    // Display initial set of repositories
    repos.slice(0, MAX_REPOS).forEach(repo => {
        // Fetch branches count for each repo
        fetchBranchCount(repo.branches_url.split('{')[0])
            .then(count => {
                repo.branches_count = count;
                const repoCard = createRepoCard(repo);
                repoContainer.appendChild(repoCard);
            })
            .catch(() => {
                repo.branches_count = 'N/A';
                const repoCard = createRepoCard(repo);
                repoContainer.appendChild(repoCard);
            });
    });

    // Handle View More button
    if (isMoreRepos) {
        viewMoreBtn.style.display = 'flex';
        viewMoreBtn.onclick = () => {
            repoContainer.innerHTML = '';
            repos.forEach(repo => {
                fetchBranchCount(repo.branches_url.split('{')[0])
                    .then(count => {
                        repo.branches_count = count;
                        const repoCard = createRepoCard(repo);
                        repoContainer.appendChild(repoCard);
                    })
                    .catch(() => {
                        repo.branches_count = 'N/A';
                        const repoCard = createRepoCard(repo);
                        repoContainer.appendChild(repoCard);
                    });
            });
            viewMoreBtn.style.display = 'none';
        };
    } else {
        viewMoreBtn.style.display = 'none';
    }
}

// Fetch Branch Count for a Repository
async function fetchBranchCount(branchesUrl) {
    try {
        const response = await fetch(branchesUrl);
        if (!response.ok) throw new Error('Failed to fetch branches');
        const branches = await response.json();
        return branches.length;
    } catch (error) {
        console.error(error);
        return 'N/A';
    }
}

// Display Error with Shake Animation
function displayError(message) {
    const profileContainer = document.getElementById('profile-container');
    const repoContainer = document.getElementById('repo-container');

    profileContainer.innerHTML = `
        <div class="error-container">
            <i class="bx bx-error"></i>
            <p>${message}</p>
        </div>
    `;
    repoContainer.innerHTML = '';
}
