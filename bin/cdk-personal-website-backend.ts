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
    githubRepoName: process.env.GITHUB_REPO_NAME || "",
    appName: APP_NAME,
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
    apiSubDomain: process.env.API_SUB_DOMAIN || "",
    apiDomain: process.env.API_DOMAIN || "",
    apiVersion: process.env.API_VERSION || "",
    hostedZoneId: process.env.HOSTED_ZONE_ID || "",
  }
);

/* Add tags to the primary resources stack */
Tags.of(primaryResourcesStack).add("app", APP_NAME);
Tags.of(primaryResourcesStack).add("stack", "primary-resources");
Tags.of(primaryResourcesStack).add("auto-generated", "true");
