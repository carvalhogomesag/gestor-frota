// app.js

// Importa a base de dados (db) do nosso ficheiro de inicialização
// e todas as funções que vamos usar do Firestore.
import { db } from './firebase-init.js';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Ouve o evento que indica que o HTML está pronto
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
    let veiculos = []; // Este array será preenchido em tempo real pelo Firestore

    // --- Lógica Principal com Firestore ---

    // A "magia" do tempo real. Esta função é chamada automaticamente
    // sempre que há uma alteração na coleção 'veiculos' no Firestore.
    onSnapshot(collection(db, 'veiculos'), (snapshot) => {
        veiculos = []; // Limpa a lista local
        snapshot.forEach((doc) => {
            // Adiciona cada veículo da base de dados ao nosso array local,
            // incluindo o ID do documento.
            veiculos.push({ id: doc.id, ...doc.data() });
        });
        
        // Com o array 'veiculos' atualizado, re-renderiza a lista na página
        renderizarVeiculos();
        
        // Verifica se viemos da página de detalhes para editar um veículo
        verificarModoEdicao();
    });

    // --- Funções de Renderização e Formulário ---

    const renderizarVeiculos = () => {
        listaVeiculosDiv.innerHTML = '';
        if (veiculos.length === 0) {
            listaVeiculosDiv.innerHTML = '<p>Ainda não há veículos registados.</p>';
            return;
        }
        
        // Ordena os veículos por marca antes de os mostrar
        const veiculosOrdenados = [...veiculos].sort((a,b) => a.marca.localeCompare(b.marca));

        veiculosOrdenados.forEach((veiculo) => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.setAttribute('data-id', veiculo.id); // Usamos o ID do Firestore
            card.innerHTML = `
                <div>
                    <h4>${veiculo.marca} ${veiculo.modelo}</h4>
                    <p>Matrícula: ${veiculo.matricula}</p>
                </div>
                <button class="btn-apagar" data-id-apagar="${veiculo.id}">Apagar</button>
            `;
            listaVeiculosDiv.appendChild(card);
        });
    };
    
    // Função para mostrar/esconder o formulário (igual à anterior)
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
    
    // Função que é chamada quando o formulário é submetido
    const salvarVeiculo = async (evento) => {
        evento.preventDefault();
        
        const dadosVeiculo = {
            marca: inputMarca.value,
            modelo: inputModelo.value,
            matricula: inputMatricula.value.toUpperCase(),
            data_compra: inputDataCompra.value,
        };

        if (idParaEditar) {
            // Se estamos a editar, atualizamos o documento existente
            const docRef = doc(db, 'veiculos', idParaEditar);
            await updateDoc(docRef, dadosVeiculo);
        } else {
            // Se estamos a adicionar, criamos um novo documento
            dadosVeiculo.transacoes = []; // Garante que o novo veículo tem um array de transações vazio
            await addDoc(collection(db, 'veiculos'), dadosVeiculo);
        }
        
        mostrarFormulario(false); // Esconde o formulário após salvar
    };

    const apagarVeiculo = async (id) => {
        const veiculo = veiculos.find(v => v.id === id);
        if (!veiculo) return;

        const confirmado = await pedirConfirmacaoParaApagar(veiculo);
        
        if (confirmado) {
            // Apaga o documento do Firestore
            await deleteDoc(doc(db, 'veiculos', id));
            // A lista na página irá atualizar-se automaticamente graças ao onSnapshot!
        }
    };

    // Função que mostra o nosso modal de confirmação personalizado
    const pedirConfirmacaoParaApagar = (veiculo) => {
        modalConfirmacaoTexto.textContent = `Tem a certeza que deseja apagar o veículo ${veiculo.marca} ${veiculo.modelo}?`;
        modalConfirmacao.classList.remove('hidden');

        // Retorna uma "promessa" que será resolvida quando o utilizador clicar num botão
        return new Promise((resolve) => {
            btnConfirmarSim.onclick = () => {
                modalConfirmacao.classList.add('hidden');
                resolve(true); // Resolvido como 'true' se clicar em Sim
            };
            btnConfirmarNao.onclick = () => {
                modalConfirmacao.classList.add('hidden');
                resolve(false); // Resolvido como 'false' se clicar em Cancelar
            };
        });
    };

    // Função para verificar se viemos da página de detalhes para editar
    const verificarModoEdicao = () => {
        const veiculoIdParaEditar = localStorage.getItem('veiculo_para_editar_id');
        if (veiculoIdParaEditar) {
            const veiculo = veiculos.find(v => v.id === veiculoIdParaEditar);
            if (veiculo) {
                mostrarFormulario(true, veiculo);
            }
            // Limpa a instrução do localStorage para não entrar em modo de edição novamente
            localStorage.removeItem('veiculo_para_editar_id');
        }
    };

    // --- Eventos ---
    btnMostrarFormulario.addEventListener('click', () => mostrarFormulario(true));
    btnCancelar.addEventListener('click', () => mostrarFormulario(false));
    formVeiculo.addEventListener('submit', salvarVeiculo);

    // Delegação de eventos para os cliques na lista de veículos
    listaVeiculosDiv.addEventListener('click', (evento) => {
        const target = evento.target;
        
        // Se o clique foi no botão de apagar
        if (target.classList.contains('btn-apagar')) {
            evento.stopPropagation(); // Impede o clique de "borbulhar" para o card
            const id = target.getAttribute('data-id-apagar');
            apagarVeiculo(id);
        } 
        // Se o clique foi em qualquer outro lugar do card
        else if (target.closest('.veiculo-card')) {
            const card = target.closest('.veiculo-card');
            const veiculoId = card.getAttribute('data-id');
            
            // Usamos o localStorage para passar o ID para a página de detalhes
            localStorage.setItem('veiculo_selecionado_id', veiculoId);
            
            // Redireciona para a página de detalhes
            window.location.href = 'detalhes.html';
        }
    });

}); // Fim do 'DOMContentLoaded'