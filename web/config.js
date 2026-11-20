// Este e um NOVO contrato. Nao use aqui o endereco do RegistroDeRecados antigo.
// Depois de implantar ChatEntreCarteiras.sol na Sepolia, cole o endereco abaixo.
// NUNCA coloque sua chave privada ou frase secreta neste arquivo.
window.CHAT_CONFIG = Object.freeze({
  contractAddress: "0x4238aFeF47549F0edaF09a1285ADd9868D273f57", // Cole aqui o endereco do contrato ChatEntreCarteiras.sol
  chainIdHex: "0xaa36a7", // Sepolia = 11155111
  explorerBase: "https://sepolia.etherscan.io",
  pollingMs: 8000,
  lastMessagesLimit: 40
});
