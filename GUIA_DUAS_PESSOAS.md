# Guia para duas pessoas conversarem

## Antes de enviar

As duas pessoas precisam:

1. Ter MetaMask e selecionar **Ethereum Sepolia**.
2. Usar a **mesma instância** de `ChatEntreCarteiras` (o novo endereço implantado no Remix e inserido no `web/config.js`).
3. Ter os endereços públicos uma da outra (endereços que começam com `0x`).
4. Ter SepoliaETH para **enviar** mensagens (para ler não é necessário pagar gas).

O primeiro passo é implantar o novo contrato, conforme `README.md`.

## Pessoa A

1. Abre o site no Live Server, clica em **Conectar MetaMask**.
2. Copia o endereço público da Pessoa B no campo **Endereço da outra pessoa**.
3. Clica em **Abrir conversa**.
4. Digita `Oi, você está me ouvindo?` e clica em **Enviar pela MetaMask**.
5. Confirma a transação na MetaMask e espera ser incluída em bloco.

## Pessoa B

1. Abre **o mesmo site** (ou outra cópia da pasta `web` com o mesmo `contractAddress`).
2. Conecta a **própria** MetaMask à Sepolia.
3. Informa o endereço público da **Pessoa A** e clica em **Abrir conversa**.
4. Vê a mensagem de A. Se não aparecer imediatamente, clica em **Atualizar**.
5. Digita `Sim! Mensagem recebida.` e confirma na MetaMask.

## De volta à Pessoa A

A resposta aparece na conversa quando a nova transação for confirmada e o site atualizar (automaticamente a cada 8 s ou pelo botão **Atualizar**).

## Teste mais fácil num único computador

Use **dois perfis distintos do navegador** (cada um com sua MetaMask) ou duas contas dentro da MetaMask, alternando entre elas para testar. Com duas abas no mesmo perfil, normalmente as abas compartilham a mesma carteira ativa; por isso dois perfis são mais claros.

## Erros comuns

- **Contrato ainda nao configurado**: faça o deploy do NOVO contrato e preencha `web/config.js`.
- **Nao existe contrato nesse endereco**: confira o endereço e a rede Sepolia.
- **Nao foi possivel consultar**: confira se o endereço é do novo `ChatEntreCarteiras`, e não do `RegistroDeRecados` antigo; confirme também a rede e a ABI.
- **Contato deve ser outra carteira**: A e B não podem usar o mesmo endereço.
- **Mensagem vazia**: o contrato recusa mensagens sem conteúdo.
- **Falha por saldo insuficiente**: a carteira que envia deve possuir SepoliaETH para gas.
- **A outra pessoa nao ve a mensagem**: confira que ambas usam a mesma instância do contrato e informaram os endereços corretos uma da outra. Aguarde a confirmação da transação no Etherscan.

**Lembrete:** conversa pública, sem criptografia ponta a ponta. Não use para informações pessoais.
