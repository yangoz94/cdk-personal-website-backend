#!make
-include .env
export

.PHONY: synth bootstrap deploy-core-resources _destroy-core-resources deploy-primary-resources _destroy-primary-resources

synth:
	npx cdk synth $(APP_NAME)-core-resources-stack --qualifier $(CDK_QUALIFIER) --profile $(AWS_PROFILE)
	npx cdk synth $(APP_NAME)-primary-resources-stack --qualifier $(CDK_QUALIFIER) --profile $(AWS_PROFILE)

bootstrap:
	npx cdk bootstrap aws://$(AWS_ACCOUNT_ID)/$(AWS_REGION) --qualifier $(CDK_QUALIFIER) --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess --trust $(AWS_ACCOUNT_ID) --trust-for-lookup $(AWS_ACCOUNT_ID)  --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

deploy-core-resources:
	npx cdk deploy $(APP_NAME)-core-resources-stack --exclusively --output cdk.core.out --verbose --qualifier $(CDK_QUALIFIER) --require-approval never --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

_destroy-core-resources:
	npx cdk destroy $(APP_NAME)-core-resources-stack --exclusively --output cdk.core.out --verbose --qualifier $(CDK_QUALIFIER) --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

deploy-primary-resources:
	npx cdk deploy $(APP_NAME)-primary-resources-stack --output cdk.primary.out --verbose --qualifier $(CDK_QUALIFIER) --require-approval never --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

_destroy-primary-resources:
	npx cdk destroy $(APP_NAME)-primary-resources-stack --exclusively --output cdk.primary.out --verbose --qualifier $(CDK_QUALIFIER) --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)
