import axios from 'axios';

const API_BASE = 'https://zapscore-zapscore-api.gtalg3.easypanel.host';

async function main() {
    try {
        const res = await axios.get(`${API_BASE}/version`);
        console.log(`✅ API está ONLINE! Versão: ${JSON.stringify(res.data)}`);
    } catch (e) {
        console.log(`❌ API está OFFLINE ou indisponível no momento: ${e.message}`);
    }
}

main();
