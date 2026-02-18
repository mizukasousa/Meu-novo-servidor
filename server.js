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

    // ===============================
    // ✅ ENVIAR UUID
    // ===============================
    socket.send(JSON.stringify({
        cmd: "joined_server",
        content: {
            msg: "Bem-vindo ao servidor!",
            uuid: uuid
        }
    }));

    // ===============================
    // ✅ SPAWN PLAYER LOCAL
    // ===============================
    socket.send(JSON.stringify({
        cmd: "spawn_local_player",
        content: {
            player: newPlayer
        }
    }));

    // ===============================
    // ✅ SPAWN NOVO PLAYER PARA OUTROS
    // ===============================
    wss.clients.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                cmd: "spawn_new_player",
                content: {
                    player: newPlayer
                }
            }));
        }
    });

    // ===============================
    // ✅ ENVIAR PLAYERS EXISTENTES
    // ===============================
    socket.send(JSON.stringify({
        cmd: "spawn_network_players",
        content: {
            players: await playerlist.getAll()
        }
    }));


    // ===============================
    // 📩 RECEBENDO MENSAGENS
    // ===============================
    socket.on("message", async (message) => {

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

            await playerlist.update(uuid, data.content.x, data.content.y);

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

            wss.clients.forEach((client) => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(update));
                }
            });
        }

        // ===============================
        // 🔫 TIRO MULTIPLAYER
        // ===============================
        if (data.cmd === "shoot") {

            const shoot = {
                cmd: "shoot",
                content: {
                    uuid: uuid,
                    x: data.content.x,
                    y: data.content.y,
                    dir: data.content.dir
                }
            };

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(shoot));
                }
            });
        }

        // ===============================
        // 💥 SISTEMA DE DANO
        // ===============================
        if (data.cmd === "hit") {

            const target = data.content.target;
            const damage = data.content.damage;

            console.log(`💥 ${uuid} acertou ${target} causando ${damage} de dano`);

            // valida se o player existe
            const playerExists = await playerlist.get(target);
            if (!playerExists) return;

            const applyDamage = {
                cmd: "apply_damage",
                content: {
                    target: target,
                    damage: damage
                }
            };

            // envia para todos
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(applyDamage));
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
