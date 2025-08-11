// detalhes.js (Versão Completa e Final)

import { db } from './firebase-init.js';
import { doc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const infoVeiculoDiv = document.getElementById('info-veiculo');
    const listaTransacoesDiv = document.getElementById('lista-transacoes');
    const modal = document.getElementById('modal-transacao');
    const formTransacao = document.getElementById('form-transacao');
    const btnAddReceita = document.getElementById('btn-add-receita');
    const btnAddDespesa = document.getElementById('btn-add-despesa');
    const btnGerarPDF = document.getElementById('btn-gerar-pdf');
    const btnCancelarTransacao = document.getElementById('btn-cancelar-transacao');
    const modalTitulo = document.getElementById('modal-titulo');
    const inputId = document.getElementById('transacao-id');
    const inputTipo = document.getElementById('transacao-tipo');
    const selectCategoria = document.getElementById('transacao-categoria');
    const totalReceitasP = document.getElementById('total-receitas');
    const totalDespesasP = document.getElementById('total-despesas');
    const saldoVeiculoP = document.getElementById('saldo-veiculo');

    // --- Carregar Dados ---
    const veiculoId = localStorage.getItem('veiculo_selecionado_id');
    if (!veiculoId) {
        alert("Nenhum veículo selecionado. A redirecionar...");
        window.location.href = 'index.html';
        return;
    }

    let veiculo;
    let transacoes = [];
    
    // Referências do Firestore
    const veiculoRef = doc(db, 'veiculos', veiculoId);
    const transacoesRef = collection(veiculoRef, 'transacoes');

    // Variáveis para guardar as categorias
    let categoriasReceita = [];
    let categoriasDespesa = [];

    // --- Funções ---

    const carregarCategorias = async () => {
        try {
            const docReceitaRef = doc(db, 'configuracoes', 'categoriasReceita');
            const docDespesaRef = doc(db, 'configuracoes', 'categoriasDespesa');
            
            const docReceitaSnap = await getDoc(docReceitaRef);
            const docDespesaSnap = await getDoc(docDespesaRef);

            categoriasReceita = docReceitaSnap.exists() ? docReceitaSnap.data().lista : ['Aluguer'];
            categoriasDespesa = docDespesaSnap.exists() ? docDespesaSnap.data().lista : ['Manutenção'];
        } catch (error) {
            console.error("Erro ao carregar categorias, usando valores padrão.", error);
            categoriasReceita = ['Aluguer'];
            categoriasDespesa = ['Manutenção'];
        }
    };

    const formatarDinheiro = (valor) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);
    
    const carregarDetalhesVeiculo = async () => {
        try {
            const docSnap = await getDoc(veiculoRef);
            if (docSnap.exists()) {
                veiculo = { id: docSnap.id, ...docSnap.data() };
                renderizarDetalhes();
            } else {
                alert("Veículo não encontrado. A redirecionar para a página principal.");
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Erro ao carregar detalhes do veículo: ", error);
        }
    };

    const q = query(transacoesRef, orderBy('data', 'desc'));
    onSnapshot(q, (snapshot) => {
        transacoes = [];
        snapshot.forEach((doc) => {
            transacoes.push({ id: doc.id, ...doc.data() });
        });
        renderizarTransacoes();
    });
    
    const renderizarDetalhes = () => {
        if (!veiculo) return;
        const nomeVeiculo = `${veiculo.marca} ${veiculo.modelo}`;
        document.title = `${nomeVeiculo} - Detalhes`;
        document.querySelector('header h1').textContent = nomeVeiculo;

        const dataFormatada = new Date(veiculo.data_compra).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
        infoVeiculoDiv.innerHTML = `
            <h2>Informações Gerais</h2>
            <p><strong>Matrícula:</strong> ${veiculo.matricula}</p>
            <p><strong>Data de Compra:</strong> ${dataFormatada}</p>
        `;
    };

    const renderizarTransacoes = () => {
        listaTransacoesDiv.innerHTML = '';
        let totalReceitas = 0, totalDespesas = 0;

        if (transacoes.length === 0) {
            listaTransacoesDiv.innerHTML = '<p>Ainda não há transações para este veículo.</p>';
        } else {
            transacoes.forEach(t => {
                const valor = parseFloat(t.valor);
                const classeValor = t.tipo === 'receita' ? 'receita' : 'despesa';
                if (t.tipo === 'receita') totalReceitas += valor; else totalDespesas += valor;

                const item = document.createElement('div');
                item.className = 'transacao-item';
                item.innerHTML = `
                    <div class="transacao-info">
                        <p class="descricao">${t.descricao}</p>
                        <p class="data">${t.categoria} - ${new Date(t.data).toLocaleDateString('pt-PT')}</p>
                    </div>
                    <div class="transacao-acoes">
                        <span class="transacao-valor ${classeValor}">${t.tipo === 'receita' ? '+' : '-'} ${formatarDinheiro(valor)}</span>
                        <button class="btn-transacao-editar" data-id="${t.id}">✎</button>
                        <button class="btn-transacao-apagar" data-id="${t.id}">×</button>
                    </div>`;
                listaTransacoesDiv.appendChild(item);
            });
        }
        const saldo = totalReceitas - totalDespesas;
        totalReceitasP.textContent = formatarDinheiro(totalReceitas);
        totalDespesasP.textContent = formatarDinheiro(totalDespesas);
        saldoVeiculoP.textContent = formatarDinheiro(saldo);
        saldoVeiculoP.parentElement.className = 'resumo-card saldo ' + (saldo < 0 ? 'despesa' : 'receita');
    };

    const salvarTransacao = async (e) => {
        e.preventDefault();
        const idTransacao = inputId.value;
        
        const dadosTransacao = {
            tipo: inputTipo.value,
            descricao: document.getElementById('transacao-descricao').value,
            categoria: document.getElementById('transacao-categoria').value,
            valor: parseFloat(document.getElementById('transacao-valor').value),
            data: document.getElementById('transacao-data').value
        };

        try {
            if (idTransacao) { // Atualizar
                const transacaoRef = doc(db, 'veiculos', veiculoId, 'transacoes', idTransacao);
                await updateDoc(transacaoRef, dadosTransacao);
            } else { // Criar
                await addDoc(transacoesRef, dadosTransacao);
            }
            fecharModal();
        } catch (error) {
            console.error("Erro ao salvar transação: ", error);
            alert("Ocorreu um erro ao salvar a transação.");
        }
    };
    
    const apagarTransacao = async (id) => {
        if (confirm('Tem a certeza que deseja apagar esta transação?')) {
            try {
                const transacaoRef = doc(db, 'veiculos', veiculoId, 'transacoes', id);
                await deleteDoc(transacaoRef);
            } catch (error) {
                console.error("Erro ao apagar transação: ", error);
                alert("Ocorreu um erro ao apagar a transação.");
            }
        }
    };

    const preencherSelectCategorias = (tipo) => {
        selectCategoria.innerHTML = '';
        const categorias = tipo === 'receita' ? categoriasReceita : categoriasDespesa;
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectCategoria.appendChild(option);
        });
    };

    const mostrarModal = (tipo, transacao = null) => {
        formTransacao.reset();
        preencherSelectCategorias(tipo);
        inputTipo.value = tipo;
        
        if (transacao) { // Modo Edição
            modalTitulo.textContent = `Editar ${tipo === 'receita' ? 'Receita' : 'Despesa'}`;
            inputId.value = transacao.id;
            document.getElementById('transacao-descricao').value = transacao.descricao;
            document.getElementById('transacao-categoria').value = transacao.categoria;
            document.getElementById('transacao-valor').value = transacao.valor;
            document.getElementById('transacao-data').value = transacao.data;
        } else { // Modo Adição
            modalTitulo.textContent = `Adicionar ${tipo === 'receita' ? 'Receita' : 'Despesa'}`;
            inputId.value = '';
            document.getElementById('transacao-data').valueAsDate = new Date();
        }
        modal.classList.remove('hidden');
    };

    const fecharModal = () => modal.classList.add('hidden');

    const gerarPDF = () => {
        if (!veiculo) return;

        const transacoesOrdenadas = [...transacoes].sort((a, b) => new Date(a.data) - new Date(b.data));
        let totalReceitas = 0, totalDespesas = 0;
        
        let linhasTabela = '';
        transacoesOrdenadas.forEach(t => {
            const valor = parseFloat(t.valor);
            if (t.tipo === 'receita') totalReceitas += valor; else totalDespesas += valor;
            linhasTabela += `
                <tr>
                    <td>${new Date(t.data).toLocaleDateString('pt-PT')}</td>
                    <td>${t.descricao}</td>
                    <td>${t.categoria}</td>
                    <td class="${t.tipo === 'receita' ? 'receita' : ''}">${t.tipo === 'receita' ? formatarDinheiro(valor) : ''}</td>
                    <td class="${t.tipo === 'despesa' ? 'despesa' : ''}">${t.tipo === 'despesa' ? formatarDinheiro(valor) : ''}</td>
                </tr>
            `;
        });
        
        const saldo = totalReceitas - totalDespesas;

        const conteudoRelatorio = `
            <div class="relatorio-pdf">
                <h1>Relatório Financeiro do Veículo</h1>
                <div class="info-veiculo">
                    <p><strong>Veículo:</strong> ${veiculo.marca} ${veiculo.modelo}</p>
                    <p><strong>Matrícula:</strong> ${veiculo.matricula}</p>
                    <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-PT')}</p>
                </div>
                <h2>Transações</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Receita</th>
                            <th>Despesa</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasTabela}
                    </tbody>
                </table>
                <h2>Resumo</h2>
                <table>
                    <tr class="resumo-tabela">
                        <td>Total de Receitas:</td>
                        <td class="receita">${formatarDinheiro(totalReceitas)}</td>
                    </tr>
                    <tr class="resumo-tabela">
                        <td>Total de Despesas:</td>
                        <td class="despesa">${formatarDinheiro(totalDespesas)}</td>
                    </tr>
                    <tr class="resumo-tabela">
                        <td>Saldo Final:</td>
                        <td class="${saldo >= 0 ? 'receita' : 'despesa'}">${formatarDinheiro(saldo)}</td>
                    </tr>
                </table>
            </div>
        `;
        
        const elemento = document.createElement('div');
        elemento.innerHTML = conteudoRelatorio;

        const opt = {
          margin:       0.5,
          filename:     `relatorio_${veiculo.marca}_${veiculo.matricula}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(elemento).set(opt).save();
    };

    // --- Eventos ---
    btnAddReceita.addEventListener('click', () => mostrarModal('receita'));
    btnAddDespesa.addEventListener('click', () => mostrarModal('despesa'));
    btnGerarPDF.addEventListener('click', gerarPDF);
    btnCancelarTransacao.addEventListener('click', fecharModal);
    formTransacao.addEventListener('submit', salvarTransacao);
    modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
    
    listaTransacoesDiv.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (!id) return;

        if (e.target.classList.contains('btn-transacao-apagar')) {
            apagarTransacao(id);
        }
        if (e.target.classList.contains('btn-transacao-editar')) {
            const transacao = transacoes.find(t => t.id === id);
            if (transacao) mostrarModal(transacao.tipo, transacao);
        }
    });

    // --- Inicialização ---
    const inicializarPagina = async () => {
        await carregarCategorias();
        await carregarDetalhesVeiculo();
    };

    inicializarPagina();

});