// app.js

// Importa a base de dados (db) e as funções necessárias do Firestore
import { db } from './firebase-init.js';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores dos Elementos do DOM ---
    const secaoFormulario = document.getElementById('secao-formulario');
    const formVeiculo = document.getElementById('form-veiculo');
    const btnMostrarFormulario = document.getElementById('btn-mostrar-formulario');
    const btnCancelar = document.getElementById('btn-cancelar');
    const listaVeiculosDiv = document.getElementById('lista-veiculos');
    const tituloFormulario = secaoFormulario.querySelector('h3');
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const btnConfirmarSim = document.getElementById('btn-confirmar-sim');
    const btnConfirmarNao = document.getElementById('btn-confirmar-nao');
    const modalConfirmacaoTexto = document.getElementById('modal-confirmacao-texto');

    // Inputs do formulário
    const inputMarca = document.getElementById('marca');
    const inputModelo = document.getElementById('modelo');
    const inputMatricula = document.getElementById('matricula');
    const inputDataCompra = document.getElementById('data_compra');

    // Variáveis de estado
    let idParaEditar = null;
    let veiculos = []; // Array local que será preenchido em tempo real pelo Firestore

    // --- Lógica Principal com Firestore ---

    // Ouve por atualizações na coleção 'veiculos' em tempo real
    onSnapshot(collection(db, 'veiculos'), (snapshot) => {
        veiculos = [];
        snapshot.forEach((doc) => {
            veiculos.push({ id: doc.id, ...doc.data() });
        });
        renderizarVeiculos();
    });

    // --- Funções ---

    const renderizarVeiculos = () => {
        listaVeiculosDiv.innerHTML = '';
        if (veiculos.length === 0) {
            listaVeiculosDiv.innerHTML = '<p>Ainda não há veículos registados.</p>';
            return;
        }

        // Ordena os veículos por marca antes de os mostrar
        const veiculosOrdenados = [...veiculos].sort((a, b) => a.marca.localeCompare(b.marca));

        veiculosOrdenados.forEach((veiculo) => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.setAttribute('data-id', veiculo.id); // ID principal para o clique de detalhes
            card.innerHTML = `
                <div class="card-info">
                    <h4>${veiculo.marca} ${veiculo.modelo}</h4>
                    <p>Matrícula: ${veiculo.matricula}</p>
                </div>
                <div class="card-acoes">
                    <button class="btn-editar" data-id-editar="${veiculo.id}">Editar</button>
                    <button class="btn-apagar" data-id-apagar="${veiculo.id}">Apagar</button>
                </div>
            `;
            listaVeiculosDiv.appendChild(card);
        });
    };

    const mostrarFormulario = (mostrar, veiculo = null) => {
        if (mostrar) {
            if (veiculo) { // Modo Edição
                tituloFormulario.textContent = 'Editar Veículo';
                inputMarca.value = veiculo.marca;
                inputModelo.value = veiculo.modelo;
                inputMatricula.value = veiculo.matricula;
                inputDataCompra.value = veiculo.data_compra;
                idParaEditar = veiculo.id;
            } else { // Modo Adição
                tituloFormulario.textContent = 'Adicionar Novo Veículo';
                formVeiculo.reset();
                idParaEditar = null;
            }
            secaoFormulario.classList.remove('hidden');
            btnMostrarFormulario.classList.add('hidden');
        } else {
            secaoFormulario.classList.add('hidden');
            btnMostrarFormulario.classList.remove('hidden');
            formVeiculo.reset();
            idParaEditar = null;
        }
    };

    const salvarVeiculo = async (evento) => {
        evento.preventDefault();
        
        const dadosVeiculo = {
            marca: inputMarca.value,
            modelo: inputModelo.value,
            matricula: inputMatricula.value.toUpperCase(),
            data_compra: inputDataCompra.value,
        };

        try {
            if (idParaEditar) {
                // Atualiza um documento existente
                const docRef = doc(db, 'veiculos', idParaEditar);
                await updateDoc(docRef, dadosVeiculo);
            } else {
                // Adiciona um novo documento
                // Não precisamos de adicionar transacoes aqui, pois a estrutura da subcoleção será criada quando a primeira transação for adicionada
                await addDoc(collection(db, 'veiculos'), dadosVeiculo);
            }
            mostrarFormulario(false);
        } catch (error) {
            console.error("Erro ao salvar veículo: ", error);
            alert("Ocorreu um erro ao salvar o veículo.");
        }
    };

    const apagarVeiculo = async (id) => {
        const veiculo = veiculos.find(v => v.id === id);
        if (!veiculo) return;

        const confirmado = await pedirConfirmacaoParaApagar(veiculo);
        
        if (confirmado) {
            try {
                await deleteDoc(doc(db, 'veiculos', id));
                // A lista irá atualizar-se automaticamente graças ao onSnapshot!
            } catch (error) {
                console.error("Erro ao apagar veículo: ", error);
                alert("Ocorreu um erro ao apagar o veículo.");
            }
        }
    };

    const pedirConfirmacaoParaApagar = (veiculo) => {
        modalConfirmacaoTexto.textContent = `Tem a certeza que deseja apagar o veículo ${veiculo.marca} ${veiculo.modelo}? Todas as suas transações serão perdidas.`;
        modalConfirmacao.classList.remove('hidden');

        return new Promise((resolve) => {
            btnConfirmarSim.onclick = () => {
                modalConfirmacao.classList.add('hidden');
                resolve(true);
            };
            btnConfirmarNao.onclick = () => {
                modalConfirmacao.classList.add('hidden');
                resolve(false);
            };
        });
    };
    
    // --- Eventos ---
    btnMostrarFormulario.addEventListener('click', () => mostrarFormulario(true));
    btnCancelar.addEventListener('click', () => mostrarFormulario(false));
    formVeiculo.addEventListener('submit', salvarVeiculo);

    // Delegação de eventos para os cliques na lista de veículos
    listaVeiculosDiv.addEventListener('click', (evento) => {
        const target = evento.target;
        
        // Se o clique foi no botão de editar
        if (target.classList.contains('btn-editar')) {
            evento.stopPropagation();
            const id = target.getAttribute('data-id-editar');
            const veiculoParaEditar = veiculos.find(v => v.id === id);
            if (veiculoParaEditar) {
                mostrarFormulario(true, veiculoParaEditar);
            }
        }
        // Se o clique foi no botão de apagar
        else if (target.classList.contains('btn-apagar')) {
            evento.stopPropagation();
            const id = target.getAttribute('data-id-apagar');
            apagarVeiculo(id);
        } 
        // Se o clique foi em qualquer outro lugar do card (para ver detalhes)
        else if (target.closest('.veiculo-card')) {
            const card = target.closest('.veiculo-card');
            const veiculoId = card.getAttribute('data-id');
            localStorage.setItem('veiculo_selecionado_id', veiculoId);
            window.location.href = 'detalhes.html';
        }
    });

}); // Fim do 'DOMContentLoaded'