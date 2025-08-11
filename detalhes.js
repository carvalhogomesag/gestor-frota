document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores do DOM ---
    const infoVeiculoDiv = document.getElementById('info-veiculo');
    const listaTransacoesDiv = document.getElementById('lista-transacoes');
    const modal = document.getElementById('modal-transacao');
    const formTransacao = document.getElementById('form-transacao');
    const btnAddReceita = document.getElementById('btn-add-receita');
    const btnAddDespesa = document.getElementById('btn-add-despesa');
    const btnGerarPDF = document.getElementById('btn-gerar-pdf'); // NOVO
    const btnCancelarTransacao = document.getElementById('btn-cancelar-transacao');
    const modalTitulo = document.getElementById('modal-titulo');
    const inputId = document.getElementById('transacao-id');
    const inputTipo = document.getElementById('transacao-tipo');
    const selectCategoria = document.getElementById('transacao-categoria');
    const totalReceitasP = document.getElementById('total-receitas');
    const totalDespesasP = document.getElementById('total-despesas');
    const saldoVeiculoP = document.getElementById('saldo-veiculo');

    // --- Carregar Dados ---
    let veiculos = JSON.parse(localStorage.getItem('veiculos_db')) || [];
    const veiculoId = parseInt(localStorage.getItem('veiculo_selecionado_id'));
    let veiculo = veiculos.find(v => v.id === veiculoId);
    let veiculoIndex = veiculos.findIndex(v => v.id === veiculoId);
    let categoriasReceita = JSON.parse(localStorage.getItem('categorias_receita_db')) || ['Aluguer'];
    let categoriasDespesa = JSON.parse(localStorage.getItem('categorias_despesa_db')) || ['Manutenção', 'Combustível', 'Seguro', 'Impostos'];

    // --- Funções ---

    const salvarAlteracoes = () => {
        veiculos[veiculoIndex] = veiculo;
        localStorage.setItem('veiculos_db', JSON.stringify(veiculos));
    };

    const formatarDinheiro = (valor) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

    // NOVO: Função para gerar o PDF
    const gerarPDF = () => {
        if (!veiculo) return;

        // 1. Criar o conteúdo HTML para o PDF
        const transacoesOrdenadas = [...veiculo.transacoes].sort((a, b) => new Date(a.data) - new Date(b.data));
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
        
        // 2. Configurar e gerar o PDF com a biblioteca
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

    const renderizarDetalhes = () => { /* ... (função igual à anterior, sem alterações) ... */ 
        if (!veiculo) return;
        const dataFormatada = new Date(veiculo.data_compra).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
        infoVeiculoDiv.innerHTML = `
            <div class="secao-header">
                <div>
                    <h2>${veiculo.marca} ${veiculo.modelo}</h2>
                    <p><strong>Matrícula:</strong> ${veiculo.matricula}</p>
                    <p><strong>Data de Compra:</strong> ${dataFormatada}</p>
                </div>
                <button id="btn-editar-veiculo">Editar</button>
            </div>`;
        document.getElementById('btn-editar-veiculo').addEventListener('click', () => {
            localStorage.setItem('veiculo_para_editar_id', veiculo.id);
            window.location.href = 'index.html';
        });
    };

    const renderizarTransacoes = () => { /* ... (função igual à anterior, sem alterações) ... */ 
        listaTransacoesDiv.innerHTML = '';
        let totalReceitas = 0, totalDespesas = 0;

        if (!veiculo || !veiculo.transacoes || veiculo.transacoes.length === 0) {
            listaTransacoesDiv.innerHTML = '<p>Ainda não há transações para este veículo.</p>';
        } else {
            const transacoesOrdenadas = [...veiculo.transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
            transacoesOrdenadas.forEach(t => {
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
    
    const preencherSelectCategorias = (tipo) => { /* ... (função igual à anterior, sem alterações) ... */ 
        selectCategoria.innerHTML = '';
        const categorias = tipo === 'receita' ? categoriasReceita : categoriasDespesa;
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectCategoria.appendChild(option);
        });
    };

    const mostrarModal = (tipo, transacao = null) => { /* ... (função igual à anterior, sem alterações) ... */ 
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

    const salvarTransacao = (e) => { /* ... (função igual à anterior, sem alterações) ... */ 
        e.preventDefault();
        const idTransacao = inputId.value ? parseInt(inputId.value) : null;
        
        const dadosTransacao = {
            id: idTransacao || Date.now(),
            tipo: inputTipo.value,
            descricao: document.getElementById('transacao-descricao').value,
            categoria: document.getElementById('transacao-categoria').value,
            valor: document.getElementById('transacao-valor').value,
            data: document.getElementById('transacao-data').value
        };

        if (!veiculo.transacoes) veiculo.transacoes = [];

        if (idTransacao) { // Atualizar
            const index = veiculo.transacoes.findIndex(t => t.id === idTransacao);
            if (index !== -1) veiculo.transacoes[index] = dadosTransacao;
        } else { // Criar
            veiculo.transacoes.push(dadosTransacao);
        }

        salvarAlteracoes();
        renderizarTransacoes();
        fecharModal();
    };
    
    const apagarTransacao = (id) => { /* ... (função igual à anterior, sem alterações) ... */ 
        if (confirm('Tem a certeza que deseja apagar esta transação?')) {
            veiculo.transacoes = veiculo.transacoes.filter(t => t.id !== id);
            salvarAlteracoes();
            renderizarTransacoes();
        }
    };

    // --- Eventos ---
    btnAddReceita.addEventListener('click', () => mostrarModal('receita'));
    btnAddDespesa.addEventListener('click', () => mostrarModal('despesa'));
    btnGerarPDF.addEventListener('click', gerarPDF); // NOVO
    btnCancelarTransacao.addEventListener('click', fecharModal);
    formTransacao.addEventListener('submit', salvarTransacao);
    modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
    
    listaTransacoesDiv.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        if (e.target.classList.contains('btn-transacao-apagar')) {
            apagarTransacao(id);
        }
        if (e.target.classList.contains('btn-transacao-editar')) {
            const transacao = veiculo.transacoes.find(t => t.id === id);
            if (transacao) mostrarModal(transacao.tipo, transacao);
        }
    });

    // --- Inicialização ---
    renderizarDetalhes();
    renderizarTransacoes();
});