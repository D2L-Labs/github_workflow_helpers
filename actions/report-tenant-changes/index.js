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
    const { statusCode, body } = JSON.parse(data.Payload);
    if (statusCode !== 200) {
      throw new Error(`Lambda invocation failed: ${body}.`);
    }
    const parsedResult = JSON.parse(body);
    const fieldsCheck = parsedResult.requiredFieldsCheck;
    const syntaxCheck = parsedResult.fieldsSyntaxCheck;
    const passedCheck = fieldsCheck && syntaxCheck;
    if (!passedCheck) {
      throw new Error('Failed domain syntax and required fields check.');
    }
    const newTenantNum = parsedResult.newTenantsInfo.newTenantsNums;
    const inactiveTenantNum = parsedResult.inactiveTenantsInfo.inactiveTenantsNums;
    const changedTenantsNum = parsedResult.changedTenantsInfo.changedTenantsNums;
    const newTenantsInfo = parsedResult.newTenantsInfo.newTenants;
    const inactiveTenantsInfo = parsedResult.inactiveTenantsInfo.inactiveTenants;
    const changedTenantsInfo = parsedResult.changedTenantsInfo.changedTenants;
    console.log(`Number of new tenants added: ${newTenantNum}`);
    console.log(`Number of tenants made inactive: ${inactiveTenantNum}`);
    console.log(`Number of tenants changed: ${changedTenantsNum}`);
    console.log(`New tenants information: ${newTenantsInfo}`);
    console.log(`Inactive tenants information: ${inactiveTenantsInfo}`);
    console.log(`Changed tenants information: ${changedTenantsInfo}`);
  });
} catch (error) {
  core.setFailed(error.message);
}
