const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
let clientes = []
app.use(express.json());


function existeContaComCPF(req, res, next) {
    const { cpf } = req.headers;

    const clienteExiste = clientes.find((cliente) => cliente.cpf === cpf);
    console.log(clienteExiste);
    if (!clienteExiste) {
        return res.status(400).json({ error: "Cliente não encontrado" })
    };
    //repassa informaçaõ do middleware
    req.clienteExiste = clienteExiste;

    next();
}

function obterSaldo(extrato) {

    let saldo = extrato.reduce((acc, operacao) => {
        if (operacao.funcão === "credito") {
            return acc + operacao.valor
        } else {
            return acc - operacao.valor
        }
    }, 0);

    return saldo
}

app.post('/contas', (request, response) => {
    const { cpf, nome } = request.body

    const jaExiste = clientes.find((cliente) => cliente.cpf === cpf);

    if (jaExiste) { return response.status(400).json({ error: "O cliente já existe!" }); }

    clientes.push({ cpf, nome, id: uuidv4(), extrato: [] });

    return response.status(201).json(clientes);
});

app.get('/extrato', existeContaComCPF, (request, response) => {
    const { clienteExiste } = request
    return response.status(200).json(clienteExiste.extrato);
});

app.post('/deposita', existeContaComCPF, (request, response) => {
    const { descricao, valor } = request.body
    const { clienteExiste } = request

    clienteExiste.extrato.push({
        descricao,
        valor,
        criado_em: new Date(),
        funcão: "credito"
    })

    return response.status(201).send();
});

app.post('/sacar', existeContaComCPF, (request, response) => {
    const { valor } = request.body
    const { clienteExiste } = request;

    let saldo = obterSaldo(clienteExiste.extrato);

    if (saldo < valor) {
        return response.status(400).json({ error: "Saldo Insuficiente" });
    }

    const declaracaoDeOperacao = {
        valor,
        criado_em: new Date(),
        funcão: "debito"
    }

    clienteExiste.extrato.push(declaracaoDeOperacao);

    return response.status(201).send()

});

app.get('/extrato/data', existeContaComCPF, (request, response) => {
    const { clienteExiste } = request;
    const { data } = request.query

    const dataFormato = new Date(data + " 00:00");

    const extratos = clienteExiste.extrato.filter((extratos) => extratos.criado_em.toDateString() === new Date(dataFormato).toDateString());

    return response.status(200).json(extratos);
});

app.put('/contaAtualiza', existeContaComCPF, (request, response) => {
    const { nome } = request.body;
    const { clienteExiste } = request;
    clienteExiste.nome = nome

    return response.status(201).send();
});

app.get('/conta', existeContaComCPF, (request, response) => {
    const { clienteExiste } = request

    return response.json(clienteExiste);
});

app.delete('/conta', existeContaComCPF, (request, response) => {
    const { clienteExiste } = request

    clientes.splice(clienteExiste, 1);

    return response.status(200).json(clientes);
});


app.listen(3333);