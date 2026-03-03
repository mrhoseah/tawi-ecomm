import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";

/**
 * Creates a user in Cognito so they can sign in via Cognito provider.
 * Requires: COGNITO_USER_POOL_ID, COGNITO_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * If not configured, this is a no-op (Prisma user still created).
 */
export async function createCognitoUser(
  email: string,
  password: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const region = process.env.COGNITO_REGION;
  if (!userPoolId || !region) {
    return { ok: true }; // Skip silently - Cognito not configured
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return { ok: true }; // Skip - AWS credentials not set
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
    console.error("Cognito create failed:", err);
    return { ok: false, error: msg };
  }
}
