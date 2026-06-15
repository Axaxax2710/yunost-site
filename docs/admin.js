// admin.js — логика административной панели

let currentEditId = null;

// Проверяем, есть ли сохранённая сессия
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showAdminPanel();
                loadDashboard();
                return;
            }
        } catch (e) {}
    }
    showLoginPanel();
});

function showLoginPanel() {
    document.getElementById('loginPanel').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
    document.getElementById('loginPanel').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('adminToken', data.token || 'logged_in');
            errorDiv.classList.add('hidden');
            showAdminPanel();
            loadDashboard();
        } else {
            errorDiv.textContent = 'Неверный логин или пароль';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'Ошибка соединения';
        errorDiv.classList.remove('hidden');
    }
}

async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    localStorage.removeItem('adminToken');
    showLoginPanel();
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        
        document.getElementById('statPosts').textContent = data.postCount || 0;
        document.getElementById('statNews').textContent = data.newsCount || 0;
        document.getElementById('statArticles').textContent = data.articleCount || 0;
        document.getElementById('statFeedback').textContent = data.feedbackCount || 0;
        
        await loadPosts();
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

async function loadPosts() {
    try {
        const response = await fetch('/api/admin/posts');
        const posts = await response.json();
        
        const container = document.getElementById('postsList');
        if (!posts.length) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #718096;">Нет публикаций. Создайте первую!</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post-row">
                <div class="post-info">
                    <div class="post-title">${escapeHtml(post.title)}</div>
                    <div class="post-meta">
                        <span>${formatDate(post.published_at || post.created_at)}</span>
                        <span class="post-type ${post.type}" style="display: inline-block;">${post.type === 'news' ? 'Новость' : 'Статья'}</span>
                        ${post.featured ? '<span style="color: #f59e0b;">⭐ На главной</span>' : ''}
                    </div>
                </div>
                <div class="post-actions">
                    <button class="edit-btn" onclick="editPost(${post.id})">✏️ Редактировать</button>
                    <button class="delete-btn" onclick="deletePost(${post.id})">🗑️ Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки публикаций:', error);
    }
}

function showCreateForm() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Создать публикацию';
    document.getElementById('postType').value = 'news';
    document.getElementById('postTitle').value = '';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postFeatured').checked = false;
    document.getElementById('postModal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('postModal').classList.add('hidden');
    currentEditId = null;
}

async function savePost(event) {
    event.preventDefault();
    
    const post = {
        type: document.getElementById('postType').value,
        title: document.getElementById('postTitle').value,
        excerpt: document.getElementById('postExcerpt').value,
        content: document.getElementById('postContent').value,
        featured: document.getElementById('postFeatured').checked ? 1 : 0
    };
    
    if (!post.title) {
        alert('Введите заголовок');
        return;
    }
    
    try {
        let response;
        if (currentEditId) {
            response = await fetch(`/api/admin/posts/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });
        } else {
            response = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });
        }
        
        if (response.ok) {
            hideModal();
            loadDashboard();
        } else {
            alert('Ошибка сохранения');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

async function editPost(id) {
    try {
        const response = await fetch(`/api/admin/posts/${id}`);
        const post = await response.json();
        
        currentEditId = post.id;
        document.getElementById('modalTitle').textContent = 'Редактировать публикацию';
        document.getElementById('postType').value = post.type;
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postExcerpt').value = post.excerpt || '';
        document.getElementById('postContent').value = post.content || '';
        document.getElementById('postFeatured').checked = post.featured === 1;
        document.getElementById('postModal').classList.remove('hidden');
    } catch (error) {
        alert('Ошибка загрузки публикации');
    }
}

async function deletePost(id) {
    if (confirm('Удалить эту публикацию?')) {
        try {
            const response = await fetch(`/api/admin/posts/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadDashboard();
            } else {
                alert('Ошибка удаления');
            }
        } catch (error) {
            alert('Ошибка соединения');
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
}