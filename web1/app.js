"use strict";

// Somente a MetaMask acessa a chave privada; este site nao recebe nem armazena chaves.
const config = window.CHAT_CONFIG;
const ABI = window.CHAT_ABI;
const $ = (id) => document.getElementById(id);
let web3 = null;
let contract = null;
let selectedAccount = null;
let selectedPeer = null;
let reading = false;
let writing = false;

function setStatus(message, type = "info") {
  const area = $("status");
  area.textContent = message;
  area.className = `notice${type === "info" ? "" : ` ${type}`}`;
}

function getErrorMessage(error) {
  if (error?.code === 4001 || error?.cause?.code === 4001) return "Transacao recusada na MetaMask.";
  const message = error?.shortMessage || error?.cause?.message || error?.message || String(error);
  if (/user rejected|user denied/i.test(message)) return "Transacao recusada na MetaMask.";
  return String(message).slice(0, 240);
}

function bytesOf(text) {
  return new TextEncoder().encode(text).length;
}

function showByteCounter() {
  const n = bytesOf($("messageText").value.trim());
  $("byteCounter").textContent = `${n} / 280 bytes UTF-8`;
  $("byteCounter").classList.toggle("exceeded", n > 280);
  updateButtons();
}

function updateButtons() {
  const ready = Boolean(contract && selectedAccount);
  const chatReady = ready && Boolean(selectedPeer);
  $("connectBtn").disabled = writing;
  $("switchBtn").disabled = writing || !window.ethereum;
  $("openBtn").disabled = !ready || writing;
  $("refreshBtn").disabled = !chatReady || writing;
  $("sendBtn").disabled = !chatReady || writing || !(bytesOf($("messageText").value.trim()) > 0 && bytesOf($("messageText").value.trim()) <= 280);
}

async function verifySepolia() {
  if (!window.ethereum) throw new Error("MetaMask nao encontrada.");
  const id = await window.ethereum.request({ method: "eth_chainId" });
  if (id.toLowerCase() !== config.chainIdHex.toLowerCase()) {
    throw new Error("Rede incorreta. Mude sua MetaMask para Ethereum Sepolia (11155111).");
  }
}

function normalizeAddress(value) {
  const s = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(s)) {
    throw new Error("O contato precisa ter um endereco Ethereum valido, iniciando em 0x e com 42 caracteres.");
  }
  if (s.toLowerCase() === "0x0000000000000000000000000000000000000000") {
    throw new Error("O endereco zero nao pode ser usado como contato.");
  }
  return s.toLowerCase();
}

async function initializeContract() {
  if (typeof window.Web3 !== "function") throw new Error("Web3.js nao carregou; verifique a internet.");
  await verifySepolia();
  if (!/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
    throw new Error("Novo contrato ainda nao configurado. Implante ChatEntreCarteiras.sol e preencha web/config.js.");
  }
  web3 = new window.Web3(window.ethereum);
  const code = await web3.eth.getCode(config.contractAddress);
  if (!code || code === "0x" || code === "0x0") {
    throw new Error("Nao existe contrato nesse endereco na Sepolia. Confira web/config.js.");
  }
  contract = new web3.eth.Contract(ABI, config.contractAddress);
  $("contractAddress").textContent = config.contractAddress;
}

async function connect() {
  try {
    if (!window.ethereum) throw new Error("Instale a extensao MetaMask no navegador.");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts?.[0]) throw new Error("Nenhuma conta MetaMask selecionada.");
    selectedAccount = accounts[0];
    $("walletText").textContent = `Conectada: ${selectedAccount}`;
    $("myAddress").textContent = selectedAccount;
    await initializeContract();
    setStatus("MetaMask conectada! Cole o endereco da outra pessoa e clique em Abrir conversa.", "success");
    updateButtons();
    if (selectedPeer) await loadConversation({ silent: true });
  } catch (error) {
    contract = null;
    setStatus(getErrorMessage(error), "error");
  } finally {
    updateButtons();
  }
}

async function switchNetwork() {
  if (!window.ethereum) return setStatus("MetaMask nao encontrada.", "error");
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: config.chainIdHex }] });
    setStatus("Rede Sepolia selecionada. Clique em Conectar MetaMask.", "success");
  } catch (error) {
    setStatus(`Erro ao trocar de rede: ${getErrorMessage(error)}`, "error");
  }
}

async function openConversation() {
  if (!contract || !selectedAccount) return setStatus("Conecte a MetaMask primeiro.", "error");
  try {
    const peer = normalizeAddress($("contactAddress").value);
    if (peer === selectedAccount.toLowerCase()) throw new Error("Use o endereco de outra carteira, nao o seu.");
    selectedPeer = peer;
    $("peerAddress").textContent = peer;
    $("chatTitle").textContent = `Contato: ${peer.slice(0, 8)}…${peer.slice(-6)}`;
    $("messageCount").textContent = "Carregando...";
    $("messages").replaceChildren();
    updateButtons();
    await loadConversation();
  } catch (error) {
    setStatus(getErrorMessage(error), "error");
  }
}

function makeMessageBubble(raw) {
  const sender = String(raw.remetente ?? raw[0]);
  const body = String(raw.texto ?? raw[2]);
  const timestamp = Number(raw.momento ?? raw[3]);
  const isMine = sender.toLowerCase() === selectedAccount.toLowerCase();
  const bubble = document.createElement("article");
  bubble.className = isMine ? "bubble mine" : "bubble";
  const who = document.createElement("div");
  who.className = "who";
  who.textContent = isMine ? "Você" : "Contato";
  const text = document.createElement("div");
  text.className = "body";
  text.textContent = body; // nunca usar innerHTML com mensagens publicas
  const when = document.createElement("div");
  when.className = "when";
  when.textContent = Number.isFinite(timestamp) && timestamp > 0
    ? new Date(timestamp * 1000).toLocaleString("pt-BR")
    : "Sem data";
  bubble.append(who, text, when);
  return bubble;
}

async function loadConversation({ silent = false, scrollToEnd = false } = {}) {
  if (reading || !contract || !selectedAccount || !selectedPeer || writing) return;
  reading = true;
  const peer = selectedPeer;
  const account = selectedAccount;
  try {
    await verifySepolia();
    // Fornecer 'from' identifica a carteira que consulta a conversa.
    // call() nao assina nem envia transacao.
    const rawTotal = await contract.methods.quantidadeMensagens(peer).call({ from: account });
    const total = Number(rawTotal);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error("Quantidade de mensagens invalida.");
    const end = total;
    const start = Math.max(0, end - config.lastMessagesLimit);
    const indexes = Array.from({ length: end - start }, (_, i) => start + i);
    const data = await Promise.all(indexes.map(index =>
      contract.methods.consultarMensagem(peer, index).call({ from: account })
    ));
    if (peer !== selectedPeer || account !== selectedAccount) return;
    const area = $("messages");
    const wasNearBottom = area.scrollHeight - area.clientHeight - area.scrollTop < 80;
    const frag = document.createDocumentFragment();
    if (start > 0) {
      const note = document.createElement("p");
      note.className = "hint";
      note.textContent = `Exibindo somente as ultimas ${end - start} de ${total} mensagens.`;
      frag.append(note);
    }
    if (data.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Nenhuma mensagem entre estas duas carteiras. Envie a primeira!";
      frag.append(empty);
    } else {
      data.forEach(item => frag.append(makeMessageBubble(item)));
    }
    area.replaceChildren(frag);
    $("messageCount").textContent = String(total);
    if (scrollToEnd || wasNearBottom) area.scrollTop = area.scrollHeight;
    if (!silent) setStatus(`Conversa atualizada: ${total} mensagem(ns) registrada(s) na Sepolia.`, "success");
  } catch (error) {
    if (!silent) setStatus(`Nao foi possivel consultar: ${getErrorMessage(error)}`, "error");
  } finally {
    reading = false;
  }
}

function showTransaction(hash) {
  const tx = String(hash);
  $("txText").textContent = tx;
  if (/^0x[a-fA-F0-9]{64}$/.test(tx)) {
    $("txLink").href = `${config.explorerBase}/tx/${tx}`;
    $("txLink").hidden = false;
  }
}

async function sendMessage(event) {
  event.preventDefault();
  if (!contract || !selectedAccount || !selectedPeer || writing) {
    return setStatus("Conecte a carteira e escolha um contato primeiro.", "error");
  }
  const text = $("messageText").value.trim();
  const length = bytesOf(text);
  if (length === 0) return setStatus("Digite uma mensagem nao vazia.", "error");
  if (length > 280) return setStatus("Mensagem muito longa: limite de 280 bytes UTF-8.", "error");
  writing = true;
  updateButtons();
  $("txLink").hidden = true;
  $("txText").textContent = "Aguardando sua confirmacao na MetaMask...";
  try {
    await verifySepolia();
    // send() pede assinatura na MetaMask e cria uma transacao de escrita.
    const receipt = await contract.methods.enviarMensagem(selectedPeer, text)
      .send({ from: selectedAccount })
      .on("transactionHash", hash => {
        showTransaction(hash);
        setStatus("Transacao enviada; aguardando confirmacao em bloco...");
      });
    if (receipt?.status === 0 || receipt?.status === 0n || receipt?.status === false) {
      throw new Error("Transacao falhou.");
    }
    if (receipt?.transactionHash) showTransaction(receipt.transactionHash);
    $("messageText").value = "";
    showByteCounter();
    setStatus("Mensagem confirmada na blockchain!", "success");
  } catch (error) {
    setStatus(`Mensagem nao enviada: ${getErrorMessage(error)}`, "error");
    $("txText").textContent = "Sem confirmacao de envio nesta tentativa.";
  } finally {
    writing = false;
    updateButtons();
    await loadConversation({ silent: true, scrollToEnd: true });
  }
}

$("connectBtn").addEventListener("click", connect);
$("switchBtn").addEventListener("click", switchNetwork);
$("openBtn").addEventListener("click", openConversation);
$("refreshBtn").addEventListener("click", () => loadConversation());
$("chatForm").addEventListener("submit", sendMessage);
$("messageText").addEventListener("input", showByteCounter);
$("contactAddress").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); openConversation(); } });
if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
setInterval(() => {
  if (document.visibilityState === "visible" && contract && selectedPeer && !writing) {
    loadConversation({ silent: true });
  }
}, config.pollingMs);
showByteCounter();
if (!window.ethereum) {
  setStatus("MetaMask nao encontrada. Instale ou habilite a extensao.", "error");
} else if (!config.contractAddress) {
  setStatus("Novo contrato ainda nao implantado. Faca o deploy no Remix e configure web/config.js.");
}
