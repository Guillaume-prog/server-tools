const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function execProm(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) reject(err.message);
            else if (stderr) reject(stderr);
            else resolve(stdout);
        });
    });
}

async function get_vhosts() {
    const root = "/etc/apache2/sites-enabled";
    const out = await execProm(`ls ${root}`);

    const formattedOut = out
        .trim()
        .split("\n")
        .map((x) => path.join(root, x));

    return formattedOut;
}

function parse_vhost(vlink) {
    const text = fs
        .readFileSync(vlink, { encoding: "utf-8" })
        .trim()
        .split("\n");
    const search = (term) => {
        const finds = text.filter((x) => x.search(term) != -1);
        return finds[0] == undefined ? "" : finds[0].trim().split(/\s/).pop();
    };

    const port = Number.parseInt(search("ProxyPass").split(":").pop());
    const root = search("DocumentRoot");

    return {
        name: search("ServerName"),
        type: port != NaN ? "node" : root != "" ? "static" : "other",
        port: port != NaN ? port : 0
    };
}

/* == MAIN =============================================================== */

function main() {
    get_vhosts().then((list) => {
        const items = list.map((x) => parse_vhost(x));
        console.table(items);
    });
}

main();
