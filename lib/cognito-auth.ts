import * as crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  UsernameExistsException,
  CodeMismatchException,
  ExpiredCodeException,
  UserNotFoundException,
  InvalidParameterException,
} from "@aws-sdk/client-cognito-identity-provider";

const clientId = process.env.COGNITO_CLIENT_ID ?? "";
const clientSecret = process.env.COGNITO_CLIENT_SECRET ?? "";
const region = process.env.COGNITO_REGION ?? "";

function getClient() {
  if (!clientId || !region) return null;
  return new CognitoIdentityProviderClient({ region });
}

function getSecretHash(username: string): string {
  return crypto
    .createHmac("sha256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

/** Cognito SignUp - sends verification code to email */
export async function cognitoSignUp(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "Cognito not configured" };

  const { email, password, name } = params;
  const emailTrimmed = email.trim().toLowerCase();

  try {
    await client.send(
      new SignUpCommand({
        ClientId: clientId,
        Username: emailTrimmed,
        Password: password,
        SecretHash: clientSecret ? getSecretHash(emailTrimmed) : undefined,
        UserAttributes: [
          { Name: "email", Value: emailTrimmed },
          { Name: "name", Value: (name || emailTrimmed).slice(0, 100) },
        ],
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof UsernameExistsException) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Cognito ConfirmSignUp - verify email with code */
export async function cognitoConfirmSignUp(params: {
  email: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "Cognito not configured" };

  const emailTrimmed = params.email.trim().toLowerCase();

  try {
    await client.send(
      new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: emailTrimmed,
        ConfirmationCode: params.code.trim(),
        SecretHash: clientSecret ? getSecretHash(emailTrimmed) : undefined,
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof CodeMismatchException) {
      return { ok: false, error: "Invalid verification code. Check the code and try again." };
    }
    if (err instanceof ExpiredCodeException) {
      return { ok: false, error: "Verification code has expired. Use Resend code below to get a new one." };
    }
    if (err instanceof UserNotFoundException) {
      return { ok: false, error: "No pending verification for this email. You may already be verified—try signing in, or sign up first." };
    }
    if (err instanceof InvalidParameterException) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("verification") || msg.toLowerCase().includes("code")) {
        return { ok: false, error: "Invalid verification code." };
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Cognito ResendConfirmationCode - resend verification email */
export async function cognitoResendConfirmationCode(params: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "Cognito not configured" };

  const emailTrimmed = params.email.trim().toLowerCase();

  try {
    await client.send(
      new ResendConfirmationCodeCommand({
        ClientId: clientId,
        Username: emailTrimmed,
        SecretHash: clientSecret ? getSecretHash(emailTrimmed) : undefined,
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof UserNotFoundException) {
      return { ok: false, error: "No pending verification for this email. Try signing in or sign up first." };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Cognito ForgotPassword - sends reset code to email */
export async function cognitoForgotPassword(params: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "Cognito not configured" };

  const emailTrimmed = params.email.trim().toLowerCase();

  try {
    await client.send(
      new ForgotPasswordCommand({
        ClientId: clientId,
        Username: emailTrimmed,
        SecretHash: clientSecret ? getSecretHash(emailTrimmed) : undefined,
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/** Cognito ConfirmForgotPassword - set new password with code */
export async function cognitoConfirmForgotPassword(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "Cognito not configured" };

  const emailTrimmed = params.email.trim().toLowerCase();

  try {
    await client.send(
      new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: emailTrimmed,
        ConfirmationCode: params.code.trim(),
        Password: params.newPassword,
        SecretHash: clientSecret ? getSecretHash(emailTrimmed) : undefined,
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof CodeMismatchException) {
      return { ok: false, error: "Invalid or expired reset code." };
    }
    if (err instanceof ExpiredCodeException) {
      return { ok: false, error: "Reset code has expired. Request a new one." };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export function isCognitoConfigured(): boolean {
  return !!(clientId && region);
}

/** Decode JWT payload (no verification; we already verified via Cognito auth) */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Sign in with email + password via Cognito (USER_PASSWORD_AUTH).
 * Use when the user exists in Cognito (e.g. signed up via Cognito and verified) but may not be in Prisma.
 * Requires the app client to have USER_PASSWORD_AUTH enabled in Authentication flows.
 */
export async function cognitoSignIn(params: {
  email: string;
  password: string;
}): Promise<
  | { ok: true; email: string; name: string | null }
  | { ok: false; error: string }
> {
  const client = getClient();
  if (!client) return { ok: false, error: "Cognito not configured" };

  const emailTrimmed = params.email.trim().toLowerCase();

  const authParams: Record<string, string> = {
    USERNAME: emailTrimmed,
    PASSWORD: params.password,
  };
  if (clientSecret) {
    authParams.SECRET_HASH = getSecretHash(emailTrimmed);
  }

  try {
    const response = await client.send(
      new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "USER_PASSWORD_AUTH" as const,
        AuthParameters: authParams,
      })
    );

    if (response.ChallengeName) {
      return { ok: false, error: "Additional verification is required. Please try signing in with Google or use the link in your email." };
    }

    const idToken = response.AuthenticationResult?.IdToken;
    if (!idToken) return { ok: false, error: "Sign-in failed." };

    const payload = decodeJwtPayload(idToken);
    const email = (payload?.email as string) ?? emailTrimmed;
    const name = (payload?.name as string) ?? null;

    return { ok: true, email, name };
  } catch (err: unknown) {
    if (err instanceof UserNotFoundException) {
      return { ok: false, error: "Invalid email or password." };
    }
    if (err instanceof InvalidParameterException) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("USER_PASSWORD_AUTH") || msg.includes("not enabled")) {
        return { ok: false, error: "Email/password sign-in is not enabled for this app." };
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
