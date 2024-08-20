const fs = require('fs');
const https = require('https');
const http = require('http');
const url = require('url');

function parseArgs() {
    const args = process.argv.slice(2);
    const params = {};

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        params[key.replace('--', '')] = value.replace(/"/g, '');
    });

    return params;
}

function makeRequest(options, data, outputFilePath) {
    const lib = options.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            fs.writeFileSync(outputFilePath, responseData, 'utf8');
            console.log(`Response saved to ${outputFilePath}`);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(data);
    req.end();
}

function main() {
    const params = parseArgs();

    if (!params.url || !params.orgId || !params.botId || !params.type || !params.query || !params.datasetId || !params.searchColumn || !params.topK || !params.algorithm) {
        console.error('Error: Missing required parameters.');
        console.log('Usage: node req_search.js --url="http://localhost:3000/v2/search" --orgId="uuid" --botId="somebotid" --type="searchType" --query="searchQuery" --datasetId="uuid" --searchColumn="columnName" --topK=10');
        process.exit(1);
    }
    const requestData = JSON.stringify({
        type: params.type,
        query: params.query,
        parameters: {
            topK: Number(params.topK),
            datasetId: params.datasetId,
            searchColumn: params.searchColumn,
            algorithm: params.algorithm
        }
    });

    const options = url.parse(params.url);
    options.method = 'POST';
    options.headers = {
        'orgId': params.orgId,
        'botId': params.botId,
        'Content-Type': 'application/json'
    };

    makeRequest(options, requestData, 'output.json');
}

main();
