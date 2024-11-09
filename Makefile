#!make
-include .env
export

.PHONY: synth bootstrap _deploy-core-resources _destroy-core-resources _deploy-primary-resources _destroy-primary-resources set-up deploy __destroy

synth:
	npx cdk synth $(APP_NAME)-core-resources-stack --qualifier $(CDK_QUALIFIER) --profile $(AWS_PROFILE)
	npx cdk synth $(APP_NAME)-primary-resources-stack --qualifier $(CDK_QUALIFIER) --profile $(AWS_PROFILE)

_bootstrap:
	npx cdk bootstrap aws://$(AWS_ACCOUNT_ID)/$(AWS_REGION) --qualifier $(CDK_QUALIFIER) --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess --trust $(AWS_ACCOUNT_ID) --trust-for-lookup $(AWS_ACCOUNT_ID)  --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

_deploy-core-resources:
	npx cdk deploy $(APP_NAME)-core-resources-stack --exclusively --output cdk.core.out --verbose --qualifier $(CDK_QUALIFIER) --require-approval never --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

_destroy-core-resources:
	npx cdk destroy $(APP_NAME)-core-resources-stack --exclusively --output cdk.core.out --verbose --qualifier $(CDK_QUALIFIER) --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

_deploy-primary-resources:
	npx cdk deploy $(APP_NAME)-primary-resources-stack --output cdk.primary.out --verbose --qualifier $(CDK_QUALIFIER) --require-approval never --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

_destroy-primary-resources:
	npx cdk destroy $(APP_NAME)-primary-resources-stack --exclusively --output cdk.primary.out --verbose --qualifier $(CDK_QUALIFIER) --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

set-up:
	make _bootstrap
	make _deploy-core-resources
	make _deploy-primary-resources

deploy:
	make _deploy-core-resources
	make _deploy-primary-resources

destroy_all:
	@echo "WARNING: This will destroy all resources including the bootstrap stack."
	@read -p "Are you sure you want to proceed? (yes/no): " confirm && if [ "$$confirm" = "yes" ]; then \
		npx cdk destroy $(APP_NAME)-primary-resources-stack --exclusively --output cdk.primary.out --verbose --qualifier $(CDK_QUALIFIER) --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE); \
		npx cdk destroy $(APP_NAME)-core-resources-stack --exclusively --output cdk.core.out --verbose --qualifier $(CDK_QUALIFIER) --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE); \
		npx cdk destroy $(CDK_QUALIFIER)-cdk-bootstrap-stack --verbose --profile $(AWS_PROFILE); \
	else \
		echo "Destroy operation cancelled."; \
	fi