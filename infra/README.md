# Infra

Manual AWS setup steps for v1, captured as we go.

Codifying with Terraform or CDK is a v2 task — the goal here is to learn what the primitives are and how they fit together before automating them.

## Account

| Field | Value |
|---|---|
| Account ID | `007235366262` |
| Region | `us-east-1` |
| Admin IAM user | `Kproj_admin` (used for all CLI calls below) |

## Resources

### Networking (created 2026-06-07)

| Resource | ID | Notes |
|---|---|---|
| VPC | `vpc-03ffaac0063d2e2a6` | `10.0.0.0/16`, DNS hostnames + support enabled |
| Private subnet A | `subnet-0b0840186776024e4` | `10.0.1.0/24`, AZ `us-east-1a` |
| Private subnet B | `subnet-0f7e07896ec3b41fa` | `10.0.2.0/24`, AZ `us-east-1b` |
| Private route table | `rtb-09eaa822cdd287443` | Associated with both private subnets. No 0.0.0.0/0 route — no internet egress. |
| S3 Gateway Endpoint | `vpce-072082ebba12351c0` | Attached to private route table. Lambda reaches S3 over AWS private backbone, free, no NAT needed. |
| `sg-rds` | `sg-01bd68cbcd1b58f43` | Inbound: TCP 5432 from `sg-lambda` only |
| `sg-lambda` | `sg-0a78c1d115afd1fc3` | No inbound; all outbound (Lambda originates connections) |
| DB subnet group | `kproj-db-subnet-group` | Spans both private subnets |

### How everything was created

Single chained bash run from the project root:

```bash
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=kproj-vpc},{Key=Project,Value=kproj}]' \
  --query 'Vpc.VpcId' --output text)

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support

SUBNET_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=kproj-private-1a},{Key=Project,Value=kproj},{Key=Tier,Value=private}]' \
  --query 'Subnet.SubnetId' --output text)

SUBNET_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=kproj-private-1b},{Key=Project,Value=kproj},{Key=Tier,Value=private}]' \
  --query 'Subnet.SubnetId' --output text)

RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=kproj-private-rt},{Key=Project,Value=kproj}]' \
  --query 'RouteTable.RouteTableId' --output text)

aws ec2 associate-route-table --route-table-id $RT_ID --subnet-id $SUBNET_A
aws ec2 associate-route-table --route-table-id $RT_ID --subnet-id $SUBNET_B

SG_RDS=$(aws ec2 create-security-group --group-name kproj-rds-sg \
  --description "RDS: inbound 5432 from Lambda only" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

SG_LAMBDA=$(aws ec2 create-security-group --group-name kproj-lambda-sg \
  --description "Lambda execution: no inbound, all outbound" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id $SG_RDS \
  --protocol tcp --port 5432 --source-group $SG_LAMBDA

aws ec2 create-vpc-endpoint --vpc-id $VPC_ID \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids $RT_ID

aws rds create-db-subnet-group --db-subnet-group-name kproj-db-subnet-group \
  --db-subnet-group-description "kproj private subnets" \
  --subnet-ids $SUBNET_A $SUBNET_B
```

### Why no public subnet, IGW, or NAT in v1

- No internet ingress needed: API Gateway hosts the public HTTPS endpoint, calls Lambda via AWS internal routing (no VPC needed for that hop).
- No internet egress needed: Lambda talks to RDS (private subnet) and S3 (VPC Gateway Endpoint, free). Nothing else.
- Skipping NAT saves ~$32/mo. Skipping IGW + EIP saves complexity.
- If we ever need a one-off DB migration runner from a laptop, the plan is a migration Lambda (lives in the same VPC, reaches RDS privately), not a public bastion.

### RDS Postgres (created 2026-06-07)

| Field | Value |
|---|---|
| Identifier | `kproj-db` |
| Endpoint | `kproj-db.cur6kaw0ytee.us-east-1.rds.amazonaws.com:5432` |
| Engine | PostgreSQL 17.10 |
| Instance class | `db.t4g.micro` (ARM Graviton, free tier) |
| Storage | 20 GB gp3, encrypted |
| Multi-AZ | No (single-AZ — free tier requirement) |
| Publicly accessible | No |
| Subnet group | `kproj-db-subnet-group` |
| Security group | `sg-01bd68cbcd1b58f43` (sg-rds, ingress 5432 from sg-lambda only) |
| Master username | `postgres` |
| Master password | managed in Secrets Manager (ARN below) |
| Initial DB | `kproj` |
| Backup retention | 1 day (Free Plan cap — was originally planned at 7) |
| Deletion protection | ON |

Master secret ARN: `arn:aws:secretsmanager:us-east-1:007235366262:secret:rds!db-c809fa85-cf24-4d22-8090-4c463e04daa0-q5peku`

Create command:
```bash
aws rds create-db-instance \
  --db-instance-identifier kproj-db \
  --db-instance-class db.t4g.micro \
  --engine postgres --engine-version 17.10 \
  --allocated-storage 20 --storage-type gp3 --storage-encrypted \
  --master-username postgres --manage-master-user-password \
  --db-name kproj \
  --db-subnet-group-name kproj-db-subnet-group \
  --vpc-security-group-ids sg-01bd68cbcd1b58f43 \
  --no-publicly-accessible \
  --backup-retention-period 1 \
  --deletion-protection --no-multi-az --auto-minor-version-upgrade \
  --tags Key=Project,Value=kproj
```

### S3 bucket (created 2026-06-07)

| Field | Value |
|---|---|
| Bucket name | `kproj-media-007235366262` |
| Region | `us-east-1` |
| Block Public Access | ON (all four) |
| Versioning | Enabled |
| Encryption | SSE-S3 (AES256) with bucket-key |
| CORS origins | `http://localhost:3000` (add Vercel prod URL post-deploy) |
| Bucket policy | DenyInsecureTransport + DenyOldReadSignatures (`s3:signatureAge > 1h` for GETs) |

### Cognito (created 2026-06-07)

| Field | Value |
|---|---|
| User Pool ID | `us-east-1_XpBKRczBJ` |
| App Client ID | `59thcpejphru28qrahvpu3nusj` (SPA, no secret, auth code + PKCE) |
| Hosted UI domain | `https://kproj-auth-007235366262.auth.us-east-1.amazoncognito.com` |
| Callback URL | `http://localhost:3000/auth/callback` (add Vercel prod URL post-deploy) |
| Logout URL | `http://localhost:3000/login` |
| Token lifetimes | ID/access 1h, refresh 30d |
| Pre Sign-up trigger | `arn:aws:lambda:us-east-1:007235366262:function:kproj-presignup` |
| Identity providers | `COGNITO` + `Google` (federated, wired 2026-06-07) |
| Google IDP attribute mapping | `email`→`email`, `email_verified`→`email_verified`, `name`→`name`, `picture`→`picture`, `username`→`sub` |
| Google OAuth secret | stored in Secrets Manager at `kproj/google-oauth` (read once by `create-identity-provider`, never re-read) |
| Google Cloud redirect URI | `https://kproj-auth-007235366262.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` |

### DynamoDB allowlist (created 2026-06-07)

| Field | Value |
|---|---|
| Table | `kproj-allowlist` |
| Billing | PAY_PER_REQUEST (covered by perpetual free tier at this scale) |
| Schema | PK `email` (string) + `addedAt`, `note` |
| Seeded | `jantiyamek@gmail.com` (owner) |

### Pre-SignUp Lambda (created 2026-06-07)

| Field | Value |
|---|---|
| Function | `kproj-presignup` |
| Runtime | Node 20, arm64, 256 MB, 10s timeout |
| Role | `kproj-presignup-role` (BasicExecution + DynamoDB GetItem on kproj-allowlist) |
| Env | `ALLOWLIST_TABLE=kproj-allowlist` |
| VPC | None (DynamoDB reachable from non-VPC Lambdas, no Secrets Manager needed) |

Behavior: rejects sign-up if email not in `kproj-allowlist`; auto-confirms + auto-verifies allowlisted federated users.

### Migration Lambda (created 2026-06-07)

| Field | Value |
|---|---|
| Function | `kproj-migrate` |
| Runtime | Node 20, arm64, 512 MB, 60s timeout |
| Role | `kproj-lambda-role` (S3 PutObject/GetObject + Secrets Manager read + VPC ENI) |
| Env | `RDS_SECRET_ARN`, `DB_HOST`, `DB_PORT=5432`, `DB_NAME=kproj` |
| VPC | subnet A only, sg-lambda |
| Status | Applied initial migration `0000_solid_metal_master.sql` |

Invoke for future migrations: `aws lambda invoke --function-name kproj-migrate --cli-binary-format raw-in-base64-out --payload '{}' /tmp/out.json`. Idempotent — Drizzle's journal skips already-applied migrations.

### Lambda execution role (shared)

`kproj-lambda-role` (`arn:aws:iam::007235366262:role/kproj-lambda-role`) — used by `kproj-migrate` and will be reused by the main API Lambda. Attached policies:
- `AWSLambdaBasicExecutionRole` (managed)
- `AWSLambdaVPCAccessExecutionRole` (managed)
- inline `kproj-lambda-inline`: S3 PutObject/GetObject on bucket, SecretsManager:GetSecretValue on rds-managed secret + `kproj/*` secret prefix

### VPC Interface Endpoints (Secrets Manager + Cognito IDP)

Needed because the VPC has no NAT — without these, VPC Lambdas can't reach
regional AWS APIs (Secrets Manager for the DB password, Cognito IDP for the
JWKS keys that `aws-jwt-verify` fetches).

| Service | Endpoint ID | Type | Subnet(s) | Notes |
|---|---|---|---|---|
| S3 | `vpce-072082ebba12351c0` | Gateway | (route table) | FREE. Media blobs. |
| DynamoDB | `vpce-05a7a67d7f305c55b` | Gateway | (route table) | FREE. Allowlist lookups. |
| Secrets Manager | `vpce-032072e216e1f3b59` | Interface | A + B | DB master secret reads. ~$7/mo per AZ-ENI. |
| ~~Cognito IDP~~ | ~~`vpce-09b07b30a2d0d9126`~~ | ~~Interface~~ | — | **DELETED** — see JWKS note below. |

Interface-endpoint SG: `kproj-vpce-sg` (`sg-0b13e809c5bdbc095`) — inbound 443 from sg-lambda. Private DNS enabled.

**JWKS gotcha (important):** the Cognito IDP interface endpoint does NOT serve the
public `/.well-known/jwks.json` path — only the signed AWS API. `aws-jwt-verify`'s
runtime JWKS fetch therefore hangs in a NAT-less VPC. **Fix:** the JWKS is fetched
at build time and bundled at `api/src/cognito-jwks.json`, then loaded via
`verifier.cacheJwks(jwks)` so verification never touches the network. The Cognito
endpoint was deleted (saves $7/mo). **To refresh after a Cognito signing-key
rotation:** re-curl the JWKS into that file and redeploy. (Cognito does not
auto-rotate signing keys, so this is rare.)

Gateway endpoints (S3, DynamoDB) are FREE and the preferred choice whenever a
service offers one. Only Secrets Manager needs the paid interface endpoint here.

**CRITICAL architectural lesson (learned the hard way):**
VPC interface endpoints are **AZ-specific**. A Lambda in `us-east-1a` CANNOT
reach an interface-endpoint ENI that only exists in `us-east-1b` — the
cross-AZ traffic silently times out (no error, just hangs until the function
times out). Two consequences for kproj:
1. `com.amazonaws.us-east-1.cognito-idp` is **not available in `us-east-1a`**
   at all (only 1b/1c/1d) — confirmed via `describe-vpc-endpoint-services`.
2. Therefore **all kproj VPC Lambdas run in subnet B (`us-east-1b`) only**, where
   both the Cognito and Secrets Manager endpoints have ENIs.

If you ever add a Lambda to this VPC, put it in `subnet-0f7e07896ec3b41fa`
(subnet B) — NOT subnet A — or it won't reach Cognito/Secrets Manager.

The migration Lambda (`kproj-migrate`) was created in subnet A earlier and
worked only because Secrets Manager had an ENI there; it does not call Cognito
so it was unaffected. If re-run, prefer moving it to subnet B for consistency.

### Validation Lambda (created 2026-06-10)

| Field | Value |
|---|---|
| Function | `kproj-validate` |
| Trigger | S3 `s3:ObjectCreated:*` on `kproj-media-007235366262` (bucket notification `kproj-validate-on-create`) |
| Runtime | Node 20, arm64, 256 MB, 30s timeout |
| Role | `kproj-lambda-role` (shared) |
| VPC | subnet B only (`subnet-0f7e07896ec3b41fa`), sg-lambda |
| Env | `RDS_SECRET_ARN`, `DB_HOST`, `DB_PORT=5432`, `DB_NAME=kproj` |

Behavior: ranged GET (`bytes=0-31`) on every new object, magic-byte check
against the key's extension (jpg/png/webp/gif/avif). Mismatch or unknown
extension → deletes the object AND any `media` row with that `s3_key`.
Closes the "MIME validation is label-only" gap: a renamed `.exe` uploaded
with `Content-Type: image/png` is now removed seconds after upload.

Source: `api/src/validate.ts`. Redeploy: `pnpm --filter @kproj/api package:validate`
then `aws lambda update-function-code --function-name kproj-validate --zip-file fileb://api/validate.zip`.

NOTE for the future image-optimization pipeline: its Lambda will also fire
this validator on every derivative it writes (thumbnails etc.). Generated
WebP files will pass the check, but if the pipeline writes any non-image
artifacts (e.g. .json manifests), either scope the notification with key
prefix/suffix filters or teach the validator about those extensions.

### To be created next

- [ ] Main Lambda + API Gateway HTTP API
- [ ] JWT middleware + groups/members/media routes
- [ ] Frontend wiring + Vercel deploy

### How to test the auth path RIGHT NOW (before frontend exists)

Open this URL in a browser (works even without `localhost:3000` running — you just won't see the final redirect target):

```
https://kproj-auth-007235366262.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=59thcpejphru28qrahvpu3nusj&response_type=code&scope=openid+email+profile&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&identity_provider=Google
```

Expected flows:
- **Allowlisted Google account** (jantiyamek@gmail.com) → Google sign-in → redirects to `http://localhost:3000/auth/callback?code=…` (broken page is fine, the `?code=…` proves auth worked end-to-end through Pre-SignUp).
- **Non-allowlisted Google account** (use incognito with another Google) → Pre-SignUp Lambda rejects → Cognito shows error: *"PreSignUp failed with error Sign-up is invite-only. Email … is not on the allowlist."*
