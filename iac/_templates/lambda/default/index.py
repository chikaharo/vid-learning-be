import json

def lambda_handler(event, context):
    print("Default lambda function")
    print("Event is: ", event)

    return {
        "statusCode": 200,
        "body": json.dumps("Hello world")
    }
