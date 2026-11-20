// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ChatEntreCarteiras
 * @notice Conversas bidirecionais PUBLICAS entre pares de enderecos Ethereum.
 * @dev Mensagens sao armazenadas on-chain e qualquer pessoa pode recupera-las
 *      lendo o estado/eventos da rede. NAO utilize para dados confidenciais.
 */
contract ChatEntreCarteiras {
    struct Mensagem {
        address remetente;
        address destinatario;
        string texto;
        uint64 momento;
    }

    // O mesmo identificador e utilizado por A->B e B->A.
    mapping(bytes32 => Mensagem[]) private conversas;

    event MensagemEnviada(
        bytes32 indexed conversaId,
        address indexed remetente,
        address indexed destinatario,
        uint256 indice,
        string texto
    );

    /**
     * @notice Armazena mensagem e emite um evento de rastreabilidade.
     * @param destinatario Endereco MetaMask da outra pessoa.
     * @param texto Mensagem publica com no maximo 280 bytes UTF-8.
     */
    function enviarMensagem(address destinatario, string calldata texto) external {
        require(destinatario != address(0), "Destinatario invalido");
        require(destinatario != msg.sender, "Nao envie para si mesmo");
        require(bytes(texto).length > 0, "Mensagem vazia");
        require(bytes(texto).length <= 280, "Mensagem excede 280 bytes");

        bytes32 id = _conversaId(msg.sender, destinatario);
        uint256 indice = conversas[id].length;
        conversas[id].push(Mensagem({
            remetente: msg.sender,
            destinatario: destinatario,
            texto: texto,
            momento: uint64(block.timestamp)
        }));

        emit MensagemEnviada(id, msg.sender, destinatario, indice, texto);
    }

    /**
     * @notice Quantidade de mensagens trocadas por msg.sender e contato.
     * @dev call({from: contaDaMetaMask}) informa a identidade do leitor.
     */
    function quantidadeMensagens(address contato) external view returns (uint256) {
        require(contato != address(0), "Contato invalido");
        require(contato != msg.sender, "Contato deve ser outra carteira");
        return conversas[_conversaId(msg.sender, contato)].length;
    }

    /**
     * @notice Consulta mensagem de indice 0 a quantidade-1, sem transacao.
     */
    function consultarMensagem(address contato, uint256 indice)
        external
        view
        returns (address remetente, address destinatario, string memory texto, uint256 momento)
    {
        require(contato != address(0), "Contato invalido");
        require(contato != msg.sender, "Contato deve ser outra carteira");
        bytes32 id = _conversaId(msg.sender, contato);
        require(indice < conversas[id].length, "Indice inexistente");
        Mensagem storage m = conversas[id][indice];
        return (m.remetente, m.destinatario, m.texto, uint256(m.momento));
    }

    // Ordenar os dois enderecos garante o mesmo ID para A/B e B/A.
    function _conversaId(address a, address b) private pure returns (bytes32) {
        return uint160(a) < uint160(b)
            ? keccak256(abi.encode(a, b))
            : keccak256(abi.encode(b, a));
    }
}
