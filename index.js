const net = require("node:net");
const PORT = process.env.PORT || 3000;

/**
 * Return structure for parseClientRequest
 * @typedef {Object} ParsedReqeust
 * @property {string} method - Method of the request
 * @property {string} path - Path of the request
 * @property {string} version - HTTP version of the request
 * @property {Record<string, string>} headers - Headers received on client request
 * @property {any} body - Body parsed from the client request
 * @property {any} query - Query parameters parsed from the client request
 */
/**
 *
 * @param data {Buffer}
 * @returns {ParsedReqeust}
 */
function parseClientRequest(data) {
  console.time("parseClientRequest");
  const request = data.toString();
  const [header, body] = request.split("\r\n\r\n");
  const [requestLine, ...headerLines] = header.split("\r\n");
  const [method, path, version] = requestLine.split(" ");

  const headers = {};
  for (let i = 0; i < headerLines.length; i++) {
    const [headerKey, ...headerContent] = headerLines[i].split(":");
    headers[headerKey] = headerContent.join(":").trim();
  }
  console.timeEnd("parseClientRequest");

  const query = {};
  const queryParamsString = path.split("?")[1];
  if (queryParamsString) {
    const queryParamsArray = queryParamsString.split("&");
    for (let i = 0; i < queryParamsArray.length; i++) {
      const [key, value] = queryParamsArray[i].split("=");
      query[key] = value;
    }
  }

  let parsedBody = {};
  if (method === "POST" || method === "PUT") {
    if (headers["Content-Type"] === "application/json") {
      parsedBody = JSON.parse(body);
    }
  }

  return {
    method,
    path,
    body: parsedBody,
    headers,
    version,
    query,
  };
}

/**
 * Return structure for parseClientRequest
 * @typedef {Object} ParsedReqeust
 * @property {string} method - Method of the request
 * @property {string} path - Path of the request
 * @property {string} version - HTTP version of the request
 * @property {Record<string, string>} headers - Headers received on client request
 * @property {any} body - Body parsed from the client request
 * @property {any} query - Query parameters parsed from the client request
 */
/**
 *
 * @param statusCode {number}
 * @param contentType {string}
 * @param responseBody {any}
 * @returns {string}
 */
function createResponse(statusCode, contentType, responseBody) {
  let response = ``;
  response += `HTTP/1.1 ${statusCode}`;
  response += `\r\n`;
  response += `Content-Type: ${contentType}`;
  response += `\r\n\r\n`;
  if (responseBody) {
    if (contentType === "application/json") {
      response += JSON.stringify(responseBody);
    } else if (contentType === "text/html") {
      response += responseBody;
    } else {
        throw Error("Invalid content type or this hasn't been implemented yet.", contentType);
    }
  }
  return response;
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    console.log("Client connected.");
    const parsedRequest = parseClientRequest(data);
    let response;
    if (parsedRequest.path === "/" && parsedRequest.method === "GET") {
      response = createResponse(200, "application/json", { hello: "world" });
    } else {
      response = createResponse(
        404,
        "text/html",
        `Not Found: ${parsedRequest.path} For Method: ${parsedRequest.method}`
      );
    }
    socket.write(response);
    socket.end();
  });

  //* Client disconnects after the receiving the response
  socket.on("end", () => {
    console.log("Client disconned.");
  });

  //* Runs on error, on cases where we fuck up while sending data
  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
