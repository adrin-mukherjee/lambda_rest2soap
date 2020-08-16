const soap = require('soap');
const SERVICE_WSDL = process.env.SERVICE_WSDL || "http://www.dneonline.com/calculator.asmx?wsdl";

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
            forceSoap12Headers: true // Required if soap12 bindings are to be used
        };
        
        soap.createClient(wsdl, options, function(err, client) {
            if(err){
                reject(err);
            }
            let t1 = new Date().getTime();
            
            // Call the actual SOAP operation as defined in the WSDL
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

exports.handler = async(event)=>{
    console.log("Event >> ", event);

    try{
        // Transform request
        let transformedReq = await transformRequest(event).catch((err)=>{
            console.error("Error while transforming request >> ", err);
            throw Error('Request transformation error');
        });
    
        // Place SOAP service call
        let targetResponse = {};
        await callSOAPService(transformedReq, SERVICE_WSDL).then((result)=>{
            console.log("Result >> ", result);
            targetResponse = result;
        }).catch((err)=>{
            console.error("Error during SOAP call >> ", err);        
            throw Error('Service call error');
        });
    
        // Transform response
        let transformedResp = await transformResponse(targetResponse).catch((err)=>{
            console.error("Error while transforming response >> ", err);
            throw Error('Response transformation error');
        });
         console.log("Final response >> ", transformedResp);
        return transformedResp;
    }
    catch(err){
        return { error: err.message };   
    }
};
