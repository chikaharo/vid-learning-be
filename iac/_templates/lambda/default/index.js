exports.handler = async (event, context) => {
    console.log("Default lambda function");
    console.log("Event is: ", event);

    return {
        statusCode: 200,
        body: JSON.stringify("Hello world")
    };
};