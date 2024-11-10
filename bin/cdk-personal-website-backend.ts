#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import { CoreResourcesStack } from "../lib/stacks/1. CoreResourcesStack/=> CoreResourcesStack";
import { PrimaryResourcesStack } from "../lib/stacks/2. PrimaryResourcesStack/=> PrimaryResourcesStack";

const app = new cdk.App();

/* Specify the application name to use as a prefix in resource names. */
const APP_NAME = process.env.APP_NAME || "";

const coreResourcesStack = new CoreResourcesStack(
  app,
  `${APP_NAME}-core-resources-stack`,
  {
    appName: APP_NAME,
    githubRepoName: process.env.GITHUB_REPO_NAME || "",
    env: {
      account: process.env.AWS_ACCOUNT_ID || "",
      region: process.env.AWS_REGION || "",
    },
    synthesizer: new cdk.DefaultStackSynthesizer({
      qualifier: process.env.CDK_QUALIFIER || "",
    }),
  }
);

/* Add tags to the core resources stack */
Tags.of(coreResourcesStack).add("app", APP_NAME);
Tags.of(coreResourcesStack).add("stack", "core-resources");
Tags.of(coreResourcesStack).add("auto-generated", "true");

/* Deploy the primary backend stack
 * This is the primary stack that will contain all the resources for the backend.
 */
const primaryResourcesStack = new PrimaryResourcesStack(
  app,
  `${APP_NAME}-primary-resources-stack`,
  {
    env: {
      account: process.env.AWS_ACCOUNT_ID || "",
      region: process.env.AWS_REGION || "",
    },
    synthesizer: new cdk.DefaultStackSynthesizer({
      qualifier: process.env.CDK_QUALIFIER || "",
    }),
    appName: APP_NAME,
    domain: process.env.DOMAIN || "",
    apiSubDomain: process.env.API_SUB_DOMAIN || "",
    apiVersion: process.env.API_VERSION || "",
    authSubdomain: process.env.AUTH_SUB_DOMAIN || "",
    cdnSubDomain: process.env.CDN_SUB_DOMAIN || "",
    hostedZoneId: process.env.HOSTED_ZONE_ID || "",
    cognitoConfig: {
      selfSignUpEnabled: false,
      userGroups: [{ groupName: "Admins" }],
      callbackUrls: [
        `https://${process.env.DOMAIN}/auth/callback`,
      ] /* TO-DO: Add/Update the callback URL(s) depending on frontend */,
      logoutUrls: [
        `https://${process.env.DOMAIN}/auth/logout`,
      ] /* TO-DO: Add/Update the logout URL(s) depending on frontend */,
      flows: {
        authCodeGrant: true,
        implicitCodeGrant: true,
      },
    },
  }
);

/* Add tags to the primary resources stack */
Tags.of(primaryResourcesStack).add("app", APP_NAME);
Tags.of(primaryResourcesStack).add("stack", "primary-resources");
Tags.of(primaryResourcesStack).add("auto-generated", "true");
