const soap = require('soap');
const SERVICE_WSDL = process.env.SERVICE_WSDL || "http://www.dneonline.com/calculator.asmx?wsdl"

const transformRequest = async(event)=>{
    let targetRequest = {};
    targetRequest.intA = event.a;
    targetRequest.intB = event.b;
    return targetRequest;
};

const transformResponse = async(targetResponse)=>{
    let sourceResponse = targetResponse;
    return sourceResponse;
};

const callSOAPService = async(targetRequest, wsdl)=>{
    return new Promise((resolve, reject)=>{

        var options = {
            forceSoap12Headers: true
        };

        soap.createClient(wsdl, options, function(err, client) {
            if(err){
                reject(err);
            }
            // client.setSecurity(new soap.ClientSSLSecurity(
            //     key, // string || Buffer
            //     cert // string || Buffer
            // ));
            let t1 = new Date().getTime();
            client.Add(targetRequest, function(err, result) {
                if(err){
                    reject(err);
                }
                else{
                    let t2 = new Date().getTime();
                    console.log("Service call returned in ", (t2-t1), " msecs");
                    resolve(result);
                }
            });
        });
    });  
};

const fetchKeys= async(region_code, secretrid)=>{
    const SECRET_BINARY = "SecretBinary";
    let request = new AWS.SecretsManager({region: region_code}).getSecretValue({SecretId: secretid});
    let secretBinary;
    let t1 = new Date().getTime();

    await request.promise()
        .then(function(data){
            if(SECRET_BINARY in data){
                secretBinary = Buffer.from(data.SecretBinary); // PEM files are already base64 encoded
                let t2 = new Date().getTime();
                console.log("Keys fetched in "+ (t2-t1) + " msecs");
            }
            else{
                console.error("Expecting binary secret...not found");
                throw Error("Invalid secret- not binary");
            }
        })
        .catch(function(err){
            throw err;
        });
    return secretBinary;
};

module.export = (async(event)=>{
    console.log("Event >> ", event);

    // Transform request
    let transformedReq = await transformRequest(event).catch((err)=>{
        console.error("Error while transforming request >> ", err);
    });

    // Place SOAP service call
    let targetResponse = {};
    await callSOAPService(transformedReq, SERVICE_WSDL).then((result)=>{
        console.log("Result >> ", result);
        targetResponse = result;
    }).catch((err)=>{
        console.error("Error during SOAP call >> ", err);        
    })

    // Transform response
    let transformedResp = await transformResponse(targetResponse).catch((err)=>{
        console.error("Error while transforming response >> ", err);
    });

    console.log("Final response >> ", transformedResp);
    return transformedResp;
})({a:10, b:12});