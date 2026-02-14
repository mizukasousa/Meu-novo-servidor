# Informações do Servidor (Node.js + WebSocket)

Este servidor foi criado utilizando **Node.js** com as bibliotecas `express`, `ws` (WebSocket) e `uuid`, com foco em funcionar como backend para um jogo **multiplayer 2D na Godot Mobile (Godot 4.5)**.

Este servidor foi disponibilizado apenas para testes e demonstração. Recomendo que você configure o seu próprio servidor no Render, Termux ou outro serviço para uso real ou personalizado.

---

## Dependências

Instaladas via `npm install`:

* `express` – Para iniciar o servidor HTTP base
* `ws` – Biblioteca WebSocket para conexões em tempo real
* `uuid` – Geração de identificadores únicos para os jogadores

---

## Estrutura

```
.
├── server.js         # Código principal do servidor WebSocket
├── playerlist.js     # Armazena e atualiza os jogadores conectados
├── package.json      # Informações e scripts do projeto Node.js
└── package-lock.json # Gerado automaticamente pelo NPM
```

---

## Comandos WebSocket (servidor/cliente)

| Comando                 | Descrição                                   |
| ----------------------- | ------------------------------------------- |
| `joined_server`         | Informa o UUID do jogador                   |
| `spawn_local_player`    | Spawna o jogador local (você mesmo)         |
| `spawn_new_player`      | Spawna um novo jogador que acabou de entrar |
| `spawn_network_players` | Spawna os outros jogadores já conectados    |
| `update_position`       | Atualiza posição de outro jogador           |
| `new_chat_message`      | Envia uma mensagem de chat para todos       |
| `player_disconnected`   | Informa que um jogador saiu do jogo         |

---

## Comandos recebidos do cliente

* `position`: Atualiza a posição do jogador
* `chat`: Envia uma nova mensagem de chat

---

## playerlist.js

Arquivo que armazena todos os jogadores conectados em memória:

* `add(uuid)` – Adiciona novo jogador
* `get(uuid)` – Retorna jogador por ID
* `getAll()` – Retorna lista completa de jogadores
* `update(uuid, x, y)` – Atualiza posição
* `remove(uuid)` – Remove jogador (chamado na desconexão)

---

## Como iniciar o servidor localmente

```bash
npm install
node server.js
```

Por padrão, o servidor escuta na porta **9090**.

---

## Implantação online com Render

1. Suba os arquivos para um repositório no GitHub
2. Vá até [render.com](https://render.com) e clique em “New Web Service”
3. Escolha o repositório e configure para rodar `node server.js`
4. O serviço será hospedado com uma URL pública (`wss://...`)

> A Godot Mobile só conseguirá se conectar ao servidor usando `wss://` (com SSL).

---

## Autor da versão original

Criado por [ignurof](https://github.com/ignurof) em 2022

## Adaptado por

**Welson Rodrigues** Em 2025, para uso com **Godot 4.5 Mobile** e servidor online (Render).
