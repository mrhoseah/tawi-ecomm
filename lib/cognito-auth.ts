import * as crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
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
