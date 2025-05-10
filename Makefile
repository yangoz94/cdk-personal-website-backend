#!make
-include .env
export

.PHONY: synth bootstrap _deploy-core-resources _destroy-core-resources _deploy-primary-resources _destroy-primary-resources set-up deploy __destroy register_user get_user delete_user
 
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
	npx cdk deploy $(APP_NAME)-primary-resources-stack  --output cdk.primary.out --verbose --qualifier $(CDK_QUALIFIER) --require-approval never --toolkit-stack-name $(CDK_QUALIFIER)-cdk-bootstrap-stack --profile $(AWS_PROFILE)

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

register_user:
	@echo "Enter username: " && read username && \
	echo "Enter email: " && read email && \
	echo "Enter final password: " && read -s password && \
	\
	echo "Creating user..."; \
	aws cognito-idp admin-create-user \
		--user-pool-id $(shell aws ssm get-parameter --name /$(APP_NAME)/userpool-id --query Parameter.Value --output text) \
		--username $$username \
		--user-attributes Name="email",Value="$$email" Name="email_verified",Value="true" \
		--message-action "SUPPRESS" \
		--profile $(AWS_PROFILE) > /dev/null; \
	\
	echo "Setting permanent password..."; \
	aws cognito-idp admin-set-user-password \
		--user-pool-id $(shell aws ssm get-parameter --name /$(APP_NAME)/userpool-id --query Parameter.Value --output text) \
		--username $$username \
		--password $$password \
		--permanent \
		--profile $(AWS_PROFILE); \
	\
	echo "Adding user to Admins group..."; \
	aws cognito-idp admin-add-user-to-group \
		--user-pool-id $(shell aws ssm get-parameter --name /$(APP_NAME)/userpool-id --query Parameter.Value --output text) \
		--username $$username \
		--group-name "Admins" \
		--profile $(AWS_PROFILE); \
	\
	echo "Fetching tokens for the newly created user..."; \
	aws cognito-idp initiate-auth \
		--auth-flow USER_PASSWORD_AUTH \
		--client-id $(shell aws ssm get-parameter --name /$(APP_NAME)/userpool-client-id --query Parameter.Value --output text) \
		--auth-parameters USERNAME=$$username,PASSWORD=$$password \
		--profile $(AWS_PROFILE)

get_user:
	@read -p "Enter username: " username; \
	read -sp "Enter password: " password; echo ""; \
	client_id=$$(aws ssm get-parameter --name /$(APP_NAME)/userpool-client-id --query Parameter.Value --output text --profile $(AWS_PROFILE)); \
	aws cognito-idp initiate-auth \
		--auth-flow USER_PASSWORD_AUTH \
		--client-id $$client_id \
		--auth-parameters USERNAME=$$username,PASSWORD=$$password \
		--profile $(AWS_PROFILE)

delete_user:
	@read -p "Enter username to delete: " username; \
	echo "Deleting user $$username..."; \
	aws cognito-idp admin-delete-user \
		--user-pool-id $(shell aws ssm get-parameter --name /$(APP_NAME)/userpool-id --query Parameter.Value --output text) \
		--username $$username \
		--profile $(AWS_PROFILE); \
	echo "User $$username has been deleted."

