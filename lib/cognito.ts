import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";

export type CognitoCreateResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Creates a user in Cognito so they can sign in via Cognito provider.
 * Requires: COGNITO_USER_POOL_ID, COGNITO_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * If not configured, returns skipped (Prisma user still created).
 */
export async function createCognitoUser(
  email: string,
  password: string,
  name: string
): Promise<CognitoCreateResult> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const region = process.env.COGNITO_REGION;
  if (!userPoolId || !region) {
    console.warn("Cognito skip: COGNITO_USER_POOL_ID and COGNITO_REGION required in env");
    return { ok: true, skipped: true, reason: "Cognito not configured" };
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("Cognito skip: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY required in env");
    return { ok: true, skipped: true, reason: "AWS credentials not set" };
  }

  const client = new CognitoIdentityProviderClient({ region });

  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: name || email },
        ],
        TemporaryPassword: password,
        MessageAction: "SUPPRESS",
      })
    );
    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof UsernameExistsException) {
      return { ok: true }; // User already in Cognito, fine
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Cognito create failed for", email, ":", msg);
    return { ok: false, error: msg };
  }
}
