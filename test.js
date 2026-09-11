//node test.js — регрессия: патч не должен ломать учёт сокетов у http.Agent
const assert = require("node:assert");
const http = require("node:http");
const IPs = require("./index.js");

const server = http.createServer((req, res)=>res.end("ok"));
server.listen(0, "127.0.0.1", async()=>{
    const port = server.address().port;
    try {
        const agent = new http.Agent({ keepAlive: true });
        //как manyIPs в ccxtPatch; random() вернёт локальный адрес этой машины
        IPs.v4.patchAgent(agent);
        for(let i = 0; i < 8; i++){
            await new Promise((res, rej)=>{
                http.get({ host: "127.0.0.1", port, agent }, r=>{ r.resume(); r.on("end", res); }).on("error", rej);
            });
            await new Promise(r=>setTimeout(r, 30));
        }
        const cnt = o=>Object.values(o).reduce((a, arr)=>a + arr.length, 0);
        const busy = cnt(agent.sockets);
        const free = cnt(agent.freeSockets);
        const dead = Object.values(agent.sockets).flat().filter(s=>s.destroyed).length;
        console.log(`sockets=${busy} (мёртвых ${dead}), freeSockets=${free}`);
        //до фикса: sockets=8 под одним ключом, freeSockets=8 под другим, реюза ноль
        assert.equal(busy, 0, `в agent.sockets не должно оставаться сокетов, осталось ${busy}`);
        assert.equal(dead, 0);
        assert.ok(free >= 1 && free <= 2, `keep-alive должен переиспользоваться: freeSockets=${free}`);
        console.log("ok: учёт агента цел, keep-alive переиспользуется");
        agent.destroy(); server.close();
    } catch(err){
        console.error("FAIL:", err.message);
        server.close(); process.exitCode = 1;
    }
});
