import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface PrimaryResourcesStackProps extends cdk.StackProps {
  appName: string;
}

export class PrimaryResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PrimaryResourcesStackProps) {
    super(scope, id);
    
  }
}
