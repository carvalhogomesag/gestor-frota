// config.js (Versão Completa e Corrigida)

import { db } from './firebase-init.js';
// Importamos o setDoc, que é a correção principal
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- Seletores do DOM ---
    const formReceita = document.getElementById('form-categoria-receita');
    const inputReceita = formReceita.querySelector('input');
    const listaReceita = document.getElementById('lista-categorias-receita');

    const formDespesa = document.getElementById('form-categoria-despesa');
    const inputDespesa = formDespesa.querySelector('input');
    const listaDespesa = document.getElementById('lista-categorias-despesa');

    // --- Referências do Firestore ---
    const docReceitaRef = doc(db, 'configuracoes', 'categoriasReceita');
    const docDespesaRef = doc(db, 'configuracoes', 'categoriasDespesa');
    
    // --- Variáveis de estado ---
    let categoriasReceita = [];
    let categoriasDespesa = [];

    // --- Funções ---

    const carregarCategorias = async () => {
        try {
            const docReceitaSnap = await getDoc(docReceitaRef);
            const docDespesaSnap = await getDoc(docDespesaRef);

            // Se o documento existir, usa os dados. Senão, usa um valor padrão.
            categoriasReceita = docReceitaSnap.exists() ? docReceitaSnap.data().lista : ['Aluguer'];
            categoriasDespesa = docDespesaSnap.exists() ? docDespesaSnap.data().lista : ['Manutenção', 'Combustível', 'Seguro'];
            
            renderizarCategorias();
        } catch (error) {
            console.error("Erro ao carregar categorias: ", error);
            alert("Não foi possível carregar as configurações.");
        }
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
    
    const adicionarCategoria = async (tipo, valor) => {
        if (tipo === 'receita') {
            if (!categoriasReceita.includes(valor)) {
                categoriasReceita.push(valor);
                // Usa setDoc para criar ou substituir o documento
                await setDoc(docReceitaRef, { lista: categoriasReceita });
            }
        } else {
            if (!categoriasDespesa.includes(valor)) {
                categoriasDespesa.push(valor);
                // Usa setDoc para criar ou substituir o documento
                await setDoc(docDespesaRef, { lista: categoriasDespesa });
            }
        }
        renderizarCategorias();
    };
    
    const apagarCategoria = async (tipo, index) => {
        if (tipo === 'receita') {
            if (categoriasReceita.length > 1) {
                categoriasReceita.splice(index, 1);
                // Usa setDoc para substituir o documento com a lista atualizada
                await setDoc(docReceitaRef, { lista: categoriasReceita });
            } else {
                alert('Deve existir pelo menos uma categoria de receita.');
            }
        } else {
            if (categoriasDespesa.length > 1) {
                categoriasDespesa.splice(index, 1);
                // Usa setDoc para substituir o documento com a lista atualizada
                await setDoc(docDespesaRef, { lista: categoriasDespesa });
            } else {
                alert('Deve existir pelo menos uma categoria de despesa.');
            }
        }
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
    
    document.body.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-index')) {
            const tipo = e.target.getAttribute('data-tipo');
            const index = parseInt(e.target.getAttribute('data-index'));
            apagarCategoria(tipo, index);
        }
    });

    // --- Inicialização ---
    carregarCategorias();
});