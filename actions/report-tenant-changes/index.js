const Lambda = require('aws-sdk/clients/lambda');
const fs = require('fs');
const core = require('@actions/core');

try {
  const fileLocation = core.getInput('file-location');
  const lambda = new Lambda({
    apiVersion: '2015-03-31',
    endpoint: 'https://lambda.us-east-1.amazonaws.com',
    sslEnabled: false,
    region: 'us-east-1',
  });

  const fileStr = fs.readFileSync(fileLocation);
  const fileObj = JSON.parse(fileStr);

  const payload = {
    tenants: fileObj,
    reportOnly: false,
  };

  const invokeParams = {
    FunctionName: 'tenantManager',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload),
  };

  lambda.invoke(invokeParams, (data) => {
    const { StatusCode } = JSON.parse(data.Payload);
    core.setOutput('lambda-invocation-statuscode', StatusCode);
    const result = JSON.parse(data.Payload).body;
    const parsedResult = JSON.parse(result);
    const fieldsCheck = parsedResult.requiredFieldsCheck;
    const syntaxCheck = parsedResult.fieldsSyntaxCheck;
    const passedCheck = fieldsCheck && syntaxCheck;
    core.setOutput('failed-syntax-domain-check', passedCheck);
    const newTenantNum = parsedResult.newTenantsInfo.newTenantsNums;
    const inactiveTenantNum = parsedResult.inactiveTenantsInfo.inactiveTenantsNums;
    const changedTenantsNum = parsedResult.changedTenantsInfo.changedTenantsNums;
    const newTenantsInfo = parsedResult.newTenantsInfo.newTenants;
    const inactiveTenantsInfo = parsedResult.inactiveTenantsInfo.inactiveTenants;
    const changedTenantsInfo = parsedResult.changedTenantsInfo.changedTenants;
    core.setOutput('newTenantNum', newTenantNum);
    core.setOutput('inactiveTenantNum', inactiveTenantNum);
    core.setOutput('changedTenantsNum', changedTenantsNum);
    core.setOutput('newTenantsInfo', newTenantsInfo);
    core.setOutput('inactiveTenantsInfo', inactiveTenantsInfo);
    core.setOutput('changedTenantsInfo', changedTenantsInfo);
  });
} catch (error) {
  core.setFailed(error.message);
}
