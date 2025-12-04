// Configuração do Supabase
// Substitua as strings abaixo pelas suas chaves do Supabase
const SUPABASE_URL = 'https://xiigmqgaergjmxdqsbvf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaWdtcWdhZXJnam14ZHFzYnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODUwMjIsImV4cCI6MjA4MDM2MTAyMn0.DErisrV-fk4zf7yqVy8fiML6h5lgoOPwLMWjUA1tvU0';

// Inicializa o cliente do Supabase
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Elementos do DOM
const homePage = document.getElementById('home-page');
const goalsContainer = document.getElementById('goals-container');
const fabBtn = document.getElementById('add-goal-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const goalForm = document.getElementById('goal-form');
const goalNameInput = document.getElementById('goal-name');
const goalDepartmentSelect = document.getElementById('goal-department');
const goalTextInput = document.getElementById('goal-text');
const wordCountDisplay = document.getElementById('word-count-display');

const filterNameInput = document.getElementById('filter-name');
const filterDepartmentSelect = document.getElementById('filter-department');

let allGoals = []; // Variável global para armazenar todas as metas

// Função para gerar um número aleatório dentro de um intervalo
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para contar palavras
function countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Atualizar contagem de palavras em tempo real
goalTextInput.addEventListener('input', () => {
    const wordCount = countWords(goalTextInput.value);
    wordCountDisplay.textContent = Math.min(wordCount, 100);
    
    if (wordCount > 100) {
        goalTextInput.value = goalTextInput.value.split(/\s+/).slice(0, 100).join(' ');
    }
});

// Função para buscar e renderizar as metas do Supabase
async function fetchAndRenderGoals() {
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }

    // Busca dados no Supabase
    const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar metas:', error);
        alert('Erro ao carregar metas. Verifique o console.');
        return;
    }

    allGoals = goals; // Armazena as metas na variável global
    renderGoals(allGoals); // Renderiza todas as metas inicialmente
}

function renderGoals(goals) {
    goalsContainer.innerHTML = '';
    
    if (goals.length === 0) {
        goalsContainer.innerHTML = '<p style="width: 100%; text-align: center; color: #666;">Nenhuma meta encontrada.</p>';
        return;
    }

    // Renderiza cada meta
    goals.forEach((goal, index) => {
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        
        // Lógica de aleatorização de post-it
        const randomRotation = getRandomInt(-4, 4); 
        
        goalCard.style.setProperty('--rotation', `rotate(${randomRotation}deg)`);
        
        // Delay staggered
        const delay = index * 0.1;
        goalCard.style.animationDelay = `${delay}s`;
        
        goalCard.innerHTML = `
            <div class="goal-card-header">
                <p class="goal-card-name">${escapeHtml(goal.name)}</p>
            </div>
            <p class="goal-card-text">${escapeHtml(goal.goal)}</p>
            <div class="goal-card-footer">
                ${goal.department}
            </div>
        `;
        goalsContainer.appendChild(goalCard);
    });
}

function filterGoals() {
    const nameFilter = filterNameInput.value.toLowerCase().trim();
    const departmentFilter = filterDepartmentSelect.value;

    const filteredGoals = allGoals.filter(goal => {
        const matchesName = goal.name.toLowerCase().includes(nameFilter);
        const matchesDepartment = departmentFilter === '' || goal.department === departmentFilter;
        return matchesName && matchesDepartment;
    });

    renderGoals(filteredGoals);
}

// Event listeners para os filtros
filterNameInput.addEventListener('input', filterGoals);
filterDepartmentSelect.addEventListener('change', filterGoals);

// Função para adicionar meta no Supabase
async function addGoalToSupabase(name, goalText, department) {
    if (!supabase) {
        alert("Supabase não configurado. Verifique o arquivo script.js.");
        return;
    }

    const { data, error } = await supabase
        .from('goals')
        .insert([
            { name: name, goal: goalText, department: department }
        ])
        .select();

    if (error) {
        console.error('Erro ao adicionar meta:', error);
        alert('Erro ao salvar meta: ' + error.message);
        return false;
    }

    return true;
}

// Função para escapar HTML (prevenir XSS)
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Função para abrir o modal
function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Função para fechar o modal
function closeModal() {
    modalOverlay.classList.remove('active');
    goalForm.reset();
    wordCountDisplay.textContent = '0';
    document.body.style.overflow = '';
}

// Event listener para o botão flutuante
fabBtn.addEventListener('click', openModal);

// Event listener para fechar o modal
modalClose.addEventListener('click', closeModal);

// Event listener para fechar o modal ao clicar fora dele
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Event listener para o formulário
goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = goalNameInput.value.trim();
    const department = goalDepartmentSelect.value;
    const goal = goalTextInput.value.trim();
    const wordCount = countWords(goal);
    
    // Validações
    if (!name) {
        alert('Por favor, digite seu nome.');
        return;
    }
    
    if (!department) {
        alert('Por favor, selecione um departamento.');
        return;
    }
    
    if (!goal) {
        alert('Por favor, descreva sua meta.');
        return;
    }
    
    if (wordCount > 100) {
        alert('A meta não pode ter mais de 100 palavras.');
        return;
    }
    
    // Mostra indicador de carregamento (básico)
    const submitBtn = goalForm.querySelector('.btn-submit');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    // Adicionar a meta
    const success = await addGoalToSupabase(name, goal, department);
    
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;

    if (success) {
        // Atualizar a exibição
        await fetchAndRenderGoals();
        
        // Fechar o modal
        closeModal();
        
        // Scroll para o topo para ver as novas (já que ordenamos por data desc)
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    homePage.classList.add('active');
    
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        // Modo de demonstração ou aviso se não configurado
        console.warn('Supabase URL não configurada. Configure em script.js.');
        // Opcional: Mostrar dados mockados se quiser manter funcionalidade demo sem backend
        // Mas o pedido foi para "fazer a lógica para implementar banco de dados"
        alert('Por favor, configure as credenciais do Supabase no arquivo script.js para o aplicativo funcionar.');
    } else {
        fetchAndRenderGoals();
    }
});
