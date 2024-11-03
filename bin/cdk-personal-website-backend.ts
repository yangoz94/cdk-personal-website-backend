#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CoreResourcesStack } from "../lib/1. CoreResourcesStack/CoreResourcesStack";
import { PrimaryResourcesStack } from "../lib/2. PrimaryResourcesStack/PrimaryResourcesStack";

const app = new cdk.App();

const APP_NAME = process.env.APP_NAME || "";

/* Optional flag for deploying OIDC setup stack.
This must be used ONLY for the first deployment of the backend. */
const isCoreResourcesStackToBeDeployed =
  process.env.DEPLOY_CORE_RESOURCES === "true";

if (isCoreResourcesStackToBeDeployed) {
  new CoreResourcesStack(app, `${APP_NAME}-core-resources-stack`, {
    stackName: `${APP_NAME}-core-resources-stack`,
    githubRepoName: process.env.GITHUB_REPO_NAME || "",
    appName: APP_NAME,
    env: {
      account: process.env.AWS_ACCOUNT_ID || "",
      region: process.env.AWS_REGION || "",
    },
    synthesizer: new cdk.DefaultStackSynthesizer({
      qualifier: process.env.CDK_QUALIFIER || "",
    }),
  });
}

/* Deploy the primary backend stack
 * This is the primary stack that will contain all the resources for the backend.
 */
new PrimaryResourcesStack(app, `${APP_NAME}-primary-resources-stack`, {
  stackName: `${APP_NAME}-primary-resources-stack`,
  appName: `${APP_NAME}-backend`,
  env: {
    account: process.env.AWS_ACCOUNT_ID || "",
    region: process.env.AWS_REGION || "",
  },
  synthesizer: new cdk.DefaultStackSynthesizer({
    qualifier: process.env.CDK_QUALIFIER || "",
  }),
});
