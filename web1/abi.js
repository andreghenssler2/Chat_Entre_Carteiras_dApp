// ABI correspondente ao contrato ChatEntreCarteiras.sol (sem funcoes auxiliares).
// Se modificar a assinatura das funcoes Solidity, atualize este arquivo.
window.CHAT_ABI = [
  {
    "type": "function", "name": "enviarMensagem", "stateMutability": "nonpayable",
    "inputs": [{ "name": "destinatario", "type": "address" }, { "name": "texto", "type": "string" }],
    "outputs": []
  },
  {
    "type": "function", "name": "quantidadeMensagens", "stateMutability": "view",
    "inputs": [{ "name": "contato", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "type": "function", "name": "consultarMensagem", "stateMutability": "view",
    "inputs": [{ "name": "contato", "type": "address" }, { "name": "indice", "type": "uint256" }],
    "outputs": [
      { "name": "remetente", "type": "address" },
      { "name": "destinatario", "type": "address" },
      { "name": "texto", "type": "string" },
      { "name": "momento", "type": "uint256" }
    ]
  },
  {
    "type": "event", "name": "MensagemEnviada", "anonymous": false,
    "inputs": [
      { "name": "conversaId", "type": "bytes32", "indexed": true },
      { "name": "remetente", "type": "address", "indexed": true },
      { "name": "destinatario", "type": "address", "indexed": true },
      { "name": "indice", "type": "uint256", "indexed": false },
      { "name": "texto", "type": "string", "indexed": false }
    ]
  }
];
