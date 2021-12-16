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
      core.setFailed(`Lambda invocation failed: ${body}.`);
    }
    const parsedResult = JSON.parse(body);
    const fieldsCheck = parsedResult.requiredFieldsCheck;
    const syntaxCheck = parsedResult.fieldsSyntaxCheck;
    const passedCheck = fieldsCheck && syntaxCheck;
    if (!passedCheck) {
      core.setFailed('Failed domain syntax and required fields check.');
    }
    const newTenantNum = parsedResult.newTenantsInfo.newTenantsNums;
    const inactiveTenantNum = parsedResult.inactiveTenantsInfo.inactiveTenantsNums;
    const changedTenantsNum = parsedResult.changedTenantsInfo.changedTenantsNums;
    const newTenantsInfo = parsedResult.newTenantsInfo.newTenants;
    const inactiveTenantsInfo = parsedResult.inactiveTenantsInfo.inactiveTenants;
    const changedTenantsInfo = parsedResult.changedTenantsInfo.changedTenants;
    core.info(`Number of new tenants added: ${newTenantNum}`);
    core.info(`Number of tenants made inactive: ${inactiveTenantNum}`);
    core.info(`Number of tenants changed: ${changedTenantsNum}`);
    core.info(`New tenants information: ${newTenantsInfo}`);
    core.info(`Inactive tenants information: ${inactiveTenantsInfo}`);
    core.info(`Changed tenants information: ${changedTenantsInfo}`);
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
