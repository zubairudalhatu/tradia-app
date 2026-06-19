import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const CHALLENGE_TTL_MS = 30 * 60 * 1000;
const MINIMUM_COMPLETION_MS = 2500;

export function createHumanChallenge() {
  const left = randomInt(2, 10);
  const right = randomInt(2, 10);
  const issuedAt = Date.now();
  const nonce = randomBytes(8).toString("hex");
  const payload = `${left}:${right}:${issuedAt}:${nonce}`;
  const encodedPayload = Buffer.from(payload).toString("base64url");

  return {
    question: `What is ${left} + ${right}?`,
    token: `${encodedPayload}.${sign(encodedPayload)}`
  };
}

export function verifyHumanChallenge(token: string, answer: string) {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return false;

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const [leftValue, rightValue, issuedAtValue] = payload.split(":");
  const left = Number(leftValue);
  const right = Number(rightValue);
  const issuedAt = Number(issuedAtValue);
  const submittedAnswer = Number(answer.trim());
  const age = Date.now() - issuedAt;

  return Number.isInteger(left)
    && Number.isInteger(right)
    && Number.isInteger(issuedAt)
    && Number.isInteger(submittedAnswer)
    && age >= MINIMUM_COMPLETION_MS
    && age <= CHALLENGE_TTL_MS
    && submittedAnswer === left + right;
}

function sign(payload: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "development-secret")
    .update(`support:${payload}`)
    .digest("base64url");
}
