# Instructions

1. Clone the repository to your local.
2. Run `npm i` to install dependencies.
3. Install `aws-cli` following the guide on `https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html`. Confirm installation by running `aws --version`.
4. Configure your AWS credentials by running `aws configure`. You will need the following from your AWS account;

- `AWS Access Key ID` (generate in AWS Console)
- `AWS Secret Access Key` (generate in AWS Console)
- `AWS Default Region Name` (e.g. `us-east-1`)
- `Default Output format` (e.g. `json`)

5. Verify that your creds are configured correctly by running `aws sts get-caller-identity` and making sure there is no error.
6. Install `cdk` v2 following the guide on `https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html`. Confirm installation by running `cdk --version`

7. Install Docker Desktop from `https://www.docker.com/products/docker-desktop/` and run it in the background. It will be used for bundling lambdas.

8. Log into your Github account and create an empty repo. Follow the instructions provided by Github and add the remote to your local code that you cloned. Commit and push your initial commit to the Github repo you just created.

9. Log in to AWS console and go to Route 53 - Hosted Zones;

   - if you purchased your domain from a domain registrar other than AWS itself (e.g. Godaddy, Squarespace etc), click create Hosted Zone and enter your domain name and hit create hosted zone. In your hosted zone, you will see four NS record values. Copy them individually and add them to your domain's record in your domain registrar's console. Make sure to use the base domain while adding and do not use any subdomain here.

   - if you purchased your domain directly from AWS, your hosted zone will be automatically created by AWS. Look for it in the hosted zones tab.

10. If you plan to deploy multiple environments(dev,staging, prod etc) to seperate accounts, then you should consider adding dev, qa, prod subdomain while adding the NS records (dev.yourdomain.com, prod.yourdomain.com etc). However, given the simplicity of this app, it would be overkill for many people. Therefore, this project will NOT follow that structure.

11. Create `.env` file in the project's root directory and add all the env variables in the `env.sample` to `.env` including the hosted zone id you just created. It will be used for generating a certificate.

12. Run `make deploy-core-resources` to deploy networking resources (vpc, subnets, route tables, internet gateway etc) and OIDC and Execution Role for CI/CD pipeline. You will need to run this command only once at initial deployment.

13. Once your core resources are deployed, run `make deploy-primary-resources` and wait for it to deploy.

14. In subsequent deployments, only run `make deploy-primary-resources` and it will update/create/delete resources in your stack.

15. See CI/CD Pipeline section for detailed instructions on how to set up Github Actions with OICD roles and permissions.
