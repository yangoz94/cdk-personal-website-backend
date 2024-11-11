# Instructions

WARNING: These instructions were tested on MacOS devices with ARM architecture. If your system is using x86, you might need to make some changes to the architecture and platform fields in the lambda construct to avoid errors while bundling during deployment.

1. Clone the repository to your local.
2. Run `npm i` to install dependencies.
3. Install `aws-cli` following the guide on `https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html`. Confirm installation by running `aws --version`.
4. Configure your AWS credentials by running `aws configure`. You will need the following from your AWS account;

- `AWS Access Key ID` (generate in AWS Console)
- `AWS Secret Access Key` (generate in AWS Console)
- `AWS Default Region Name` (e.g. `us-east-1`)
- `Default Output format` (e.g. `json`)

5. Verify that your creds are configured correctly by running `aws sts get-caller-identity` and make sure there is no error.
6. Install `cdk` v2 following the guide on `https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html`. Confirm installation by running `cdk --version`

7. Install Docker Desktop from `https://www.docker.com/products/docker-desktop/` and run it in the background. It will be used for bundling lambdas.

8. Log into your Github account and create an empty repo. Follow the instructions provided by Github and add the remote to your local code that you cloned. Commit and push your initial commit to the Github repo you just created.

9. Log in to AWS console and go to Route 53 - Hosted Zones;

   - if you purchased your domain from a domain registrar other than AWS itself (e.g. Godaddy, Squarespace etc), click create Hosted Zone and enter your domain name and hit create hosted zone. In your hosted zone, you will see four NS record values. Copy them individually and add them to your domain's record in your domain registrar's console. Make sure to use the base domain while adding and do not use any subdomain here. If you plan to have multiple environments (dev,staging,prod), See Item 10 in this README.md.

   - if you purchased your domain directly from AWS, your hosted zone will be automatically created by AWS. Look for it in the hosted zones tab.

10. If you plan to deploy multiple environments(dev,staging, prod etc) to seperate accounts, then you should consider adding dev, qa, prod subdomain while adding the NS records (dev.yourdomain.com, prod.yourdomain.com etc). However, given the simplicity of this app, it would be overkill for many people. Therefore, it is outside the scope of this project.

11. Create `.env` file in the project's root directory and add all the env variables in the `env.sample` to `.env` including the hosted zone id you just created. It will be used for generating a certificate.

12. Run `make set-up` in your project's root directory. This will do the following;

- bootstrap (with your qualifier you specified)
- deploy core networking resources (VPC, Subnets, VPC Endpoints, Route Tables, Internet Gateway, OIDC role, CFN task execution role etc in case you need to set up CI/CD)
- deploy primary resources(APIGW, Lambda(s), DynamoDB, S3 bucket with Cloudfront Distribution etc)

13. In subsequent deployments, only run `make deploy` and it will update/create/delete resources in your stacks.

14. See CI/CD Pipeline section for detailed instructions on how to set up Github Actions with OICD roles and permissions.

# Setting up CI/CD After Initial Deployment

1. Once your initial deployment completes successfully following the above instructions, you can set up your CI/CD to run deployments on GitHub Actions runners, rather than from your local machine.

2. To do this, navigate to your GitHub repository where you pushed this code, click on the `Settings` tab, then `Secrets and Variables` > `Actions`, go to the `Variables` tab, and click on `New Repository Variable`.

3. Add all the environment variables from the `.env.sample` file as variables here (excluding `AWS_PROFILE` as it’s not needed for CI/CD).

Note: The core environment variables in .env.sample are already referenced in .github/workflows/main.yml using ${{ vars.<ENV_VAR_NAME> }}, but when you add more environment variables, you’ll need to update main.yml accordingly so that your workflow captures and injects the new environment variables correctly.

Note: Currently, this project only uses non-sensitive variables, so they are added as Variables instead of Secrets. If you have sensitive values, such as API keys or passwords, it’s recommended to add them as Secrets rather than Variables. In that case, reference these secrets in main.yml using ${{ secrets.<ENV_SECRET_NAME> }}.

Note: If you plan to have multiple environments (e.g., dev, qa, prod) and need environment-specific variables, consider the following:

    •	Creating separate workflows or jobs triggered by environment-specific branches (e.g., pushes to the develop branch trigger the develop_core_resources deployment job in the workflow).
    •	Creating GitHub Environments for each environment(requires paid Github Plan) and adding them to the corresponding workflow or job with environment: YOUR_ENVIRONMENT_NAME. This can be helpful if you need to specify different AWS_ACCOUNT_ID values for different environments, allowing you to deploy each environment to a different account.

These options are outside the scope of this simple backend for a personal website, but they are critical for larger projects.
