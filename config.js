document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const formReceita = document.getElementById('form-categoria-receita');
    const inputReceita = formReceita.querySelector('input');
    const listaReceita = document.getElementById('lista-categorias-receita');

    const formDespesa = document.getElementById('form-categoria-despesa');
    const inputDespesa = formDespesa.querySelector('input');
    const listaDespesa = document.getElementById('lista-categorias-despesa');

    // --- Carregar Dados ---
    // Usamos || [] para garantir que, se não houver nada, começamos com um array vazio.
    let categoriasReceita = JSON.parse(localStorage.getItem('categorias_receita_db')) || ['Aluguer'];
    let categoriasDespesa = JSON.parse(localStorage.getItem('categorias_despesa_db')) || ['Manutenção', 'Combustível', 'Seguro', 'Impostos'];

    // --- Funções ---

    const salvarCategorias = () => {
        localStorage.setItem('categorias_receita_db', JSON.stringify(categoriasReceita));
        localStorage.setItem('categorias_despesa_db', JSON.stringify(categoriasDespesa));
    };

    const renderizarCategorias = () => {
        // Limpa as listas
        listaReceita.innerHTML = '';
        listaDespesa.innerHTML = '';

        // Renderiza categorias de receita
        categoriasReceita.forEach((cat, index) => {
            const item = document.createElement('li');
            item.innerHTML = `<span>${cat}</span> <button data-tipo="receita" data-index="${index}">×</button>`;
            listaReceita.appendChild(item);
        });

        // Renderiza categorias de despesa
        categoriasDespesa.forEach((cat, index) => {
            const item = document.createElement('li');
            item.innerHTML = `<span>${cat}</span> <button data-tipo="despesa" data-index="${index}">×</button>`;
            listaDespesa.appendChild(item);
        });
    };
    
    const adicionarCategoria = (tipo, valor) => {
        if (tipo === 'receita') {
            if (!categoriasReceita.includes(valor)) {
                categoriasReceita.push(valor);
            }
        } else {
            if (!categoriasDespesa.includes(valor)) {
                categoriasDespesa.push(valor);
            }
        }
        salvarCategorias();
        renderizarCategorias();
    };
    
    const apagarCategoria = (tipo, index) => {
        if (tipo === 'receita') {
            // Não permite apagar a última categoria
            if (categoriasReceita.length > 1) {
                categoriasReceita.splice(index, 1);
            } else {
                alert('Deve existir pelo menos uma categoria de receita.');
            }
        } else {
            if (categoriasDespesa.length > 1) {
                categoriasDespesa.splice(index, 1);
            } else {
                alert('Deve existir pelo menos uma categoria de despesa.');
            }
        }
        salvarCategorias();
        renderizarCategorias();
    };

    // --- Eventos ---

    formReceita.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = inputReceita.value.trim();
        if (valor) {
            adicionarCategoria('receita', valor);
            inputReceita.value = '';
        }
    });

    formDespesa.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = inputDespesa.value.trim();
        if (valor) {
            adicionarCategoria('despesa', valor);
            inputDespesa.value = '';
        }
    });
    
    // Delegação de eventos para os botões de apagar
    document.body.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-index')) {
            const tipo = e.target.getAttribute('data-tipo');
            const index = parseInt(e.target.getAttribute('data-index'));
            apagarCategoria(tipo, index);
        }
    });

    // --- Inicialização ---
    renderizarCategorias();
});