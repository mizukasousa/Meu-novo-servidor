const express = require("express");
const WebSocket = require("ws");
const { v4 } = require("uuid");
const playerlist = require("./playerlist.js");

const app = express();
const PORT = 9090;

const server = app.listen(PORT, () => {
    console.log("Server listening on port: " + PORT);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", async (socket) => {

    const uuid = v4();
    await playerlist.add(uuid);
    const newPlayer = await playerlist.get(uuid);

    console.log("Novo jogador conectado:", uuid);

    // Enviar UUID ao cliente
    socket.send(JSON.stringify({
        cmd: "joined_server",
        content: {
            msg: "Bem-vindo ao servidor!",
            uuid: uuid
        }
    }));

    // Spawn do player local
    socket.send(JSON.stringify({
        cmd: "spawn_local_player",
        content: {
            msg: "Spawning local (you) player!",
            player: newPlayer
        }
    }));

    // Spawn do novo player para os outros
    wss.clients.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                cmd: "spawn_new_player",
                content: {
                    msg: "Spawning new network player!",
                    player: newPlayer
                }
            }));
        }
    });

    // Enviar jogadores existentes para o novo cliente
    socket.send(JSON.stringify({
        cmd: "spawn_network_players",
        content: {
            msg: "Spawning network players!",
            players: await playerlist.getAll()
        }
    }));

    // RECEBENDO MENSAGENS
    socket.on("message", (message) => {

        let data;

        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            console.error("Erro ao fazer parse do JSON:", err);
            return;
        }

        // ===============================
        // 🔥 ATUALIZAÇÃO DE POSIÇÃO
        // ===============================
        if (data.cmd === "position") {

            // Atualiza posição no playerlist
            playerlist.update(uuid, data.content.x, data.content.y);

            // 🔥 ENVIA TUDO (posição + animação + flip)
            const update = {
                cmd: "update_position",
                content: {
                    uuid: uuid,
                    x: data.content.x,
                    y: data.content.y,
                    anim: data.content.anim,
                    flip: data.content.flip
                }
            };

            // Envia para todos menos quem enviou
            wss.clients.forEach((client) => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(update));
                }
            });
        }

        // ===============================
        // 💬 CHAT
        // ===============================
        if (data.cmd === "chat") {

            const chat = {
                cmd: "new_chat_message",
                content: {
                    msg: data.content.msg
                }
            };

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(chat));
                }
            });
        }
    });

    // ===============================
    // ❌ DESCONECTAR
    // ===============================
    socket.on("close", async () => {

        console.log(`Cliente ${uuid} desconectado.`);

        await playerlist.remove(uuid);

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    cmd: "player_disconnected",
                    content: { uuid: uuid }
                }));
            }
        });
    });
});