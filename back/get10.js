let contador = 0;
exports.handler = async (event, context) => {
    contador++;
    return {
        statusCode: 200,
        body: `{"contador": ${contador}}`
    };
};
