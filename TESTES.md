# Cenários de demonstração (sem inventar evidências)

1. **Compilação e deploy:** capture no Remix o compilador sem erros, endereço do novo contrato, hash de criação e bloco Sepolia.
2. **Conversa inicialmente vazia:** A conecta, informa o endereço B e vê `0` mensagens.
3. **Envio válido A -> B:** escreva `Oi, B!`, registre e capture a confirmação MetaMask, o hash e a bolha do chat.
4. **Leitura por B:** B conecta sua própria conta MetaMask, digita o endereço de A e visualiza a mensagem original.
5. **Resposta B -> A:** B registra `Oi, A!`, confirma e A vê a mensagem no mesmo histórico; total agora `2`.
6. **Regra inválida (no Remix):** chame `enviarMensagem(enderecoB, "")`; a estimativa deve rejeitar com `Mensagem vazia`. NÃO force o envio de transação.
7. **Persistência:** atualize a página F5 e abra novamente a conversa. A e B encontram o mesmo histórico; isso comprova leitura do estado persistente.
8. **Rastreabilidade:** no Sepolia Etherscan, confira pelo menos uma transação de envio e o evento `MensagemEnviada`.

Documente resultado esperado, observado, captura, hash, bloco, gas e status para cada transação confirmada. As capturas devem vir do contrato realmente implantado.
