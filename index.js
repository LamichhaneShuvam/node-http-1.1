const net = require('node:net');
const PORT = process.env.PORT || 3000;


/**
 * Return structure for parseClientRequest
 * @typedef {Object} ParsedReqeust
 * @property {string} method - Method of the request
 * @property {string} path - Path of the request
 * @property {string} version - HTTP version of the request
 * @property {any} headers - Headers received on client request
 * @property {string} body - Body parsed from the client request
 */
/**
 *
 * @param data {Buffer}
 * @returns {ParsedReqeust}
 */
function parseClientRequest(data) {
    console.time('parseClientRequest');
    const request = data.toString();
    const [header, body] = request.split('\r\n\r\n');
    const [requestLine, ...headerLines] = header.split('\r\n');
    const [method, path, version] = requestLine.split(' ');

    const headers = {};
    for (let i = 0; i < headerLines.length; i++) {
        const [headerKey, ...headerContent] = headerLines[i].split(':');
        headers[headerKey] = headerContent.join(':').trim();
    }
    console.timeEnd('parseClientRequest')

    let parsedBody = body;
    if (method === 'POST' || method === 'PUT') {
        if (headers['Content-Type'] === 'application/json') {
            parsedBody = JSON.parse(body);
        }
    }

    return {
        method, path, body: parsedBody, headers, version,
    }
}


const server = net.createServer(socket => {
    socket.on('data', (data) => {
        const parsed = parseClientRequest(data);
        console.log(parsed)
        socket.end();
    })

    //* Client disconnects after the receiving the response
    socket.on('end', () => {
        console.log('Client disconnected.');
    });

    //* Runs on error, on cases where we fuck up while sending data
    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});