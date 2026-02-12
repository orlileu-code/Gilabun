/**
 * Session API: create session cookie from ID token, or clear session.
 */

import { getAuth } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

/**
 * Map Firebase error codes to user-friendly error messages and suggestions.
 */
function getFirebaseErrorMessage(error: unknown): {
  error: string;
  details: string;
  suggestion?: string;
} {
  const errorCode = (error as any)?.code;
  let errorMessage = error instanceof Error ? error.message : "Unknown error";
  
  // Check for nested error objects (Google Cloud API responses)
  const errorObj = error as any;
  if (errorObj?.response?.data?.error?.message) {
    errorMessage = errorObj.response.data.error.message;
  } else if (errorObj?.error?.message) {
    errorMessage = errorObj.error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
    // Try to parse JSON error messages embedded as strings
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed?.error?.message) {
        errorMessage = parsed.error.message;
      } else if (parsed?.message) {
        errorMessage = parsed.message;
      }
    } catch {
      // Not JSON, use as-is
    }
  }

  // Firebase Admin SDK error codes
  switch (errorCode) {
    case "auth/invalid-credential":
      return {
        error: "Invalid Firebase Admin credentials",
        details: "The Firebase Admin SDK credentials are invalid or malformed.",
        suggestion:
          "Check FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local. Ensure the private key includes BEGIN/END markers and newlines are properly escaped.",
      };
    case "auth/invalid-id-token":
      return {
        error: "Invalid ID token",
        details: "The provided ID token is invalid or expired.",
        suggestion: "Please try signing in again. If the problem persists, clear your browser cache and try again.",
      };
    case "auth/id-token-expired":
      return {
        error: "Sign-in expired",
        details: "Your sign-in session has expired.",
        suggestion: "Please try signing in again.",
      };
    case "auth/project-not-found":
      return {
        error: "Firebase project not found",
        details: `The Firebase project "${process.env.FIREBASE_ADMIN_PROJECT_ID}" was not found.`,
        suggestion:
          "Verify FIREBASE_ADMIN_PROJECT_ID matches your Firebase project ID in Firebase Console.",
      };
    case "auth/insufficient-permission":
      return {
        error: "Insufficient permissions",
        details: "The service account doesn't have permission to create session cookies.",
        suggestion:
          "Ensure your Firebase service account has the 'Firebase Admin SDK Administrator Service Agent' role in Google Cloud Console.",
      };
  }

  // Check for Google Cloud IAM permission errors
  if (
    errorMessage.includes("PERMISSION_DENIED") ||
    errorMessage.includes("serviceusage.serviceUsageConsumer") ||
    errorMessage.includes("serviceusage.services.use") ||
    errorMessage.includes("Caller does not have required permission")
  ) {
    // Extract project ID from error message or use env var
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "your-project";
    const iamUrl = `https://console.developers.google.com/iam-admin/iam/project?project=${projectId}`;
    return {
      error: "Service account missing required permissions",
      details:
        "The Firebase service account doesn't have permission to use the Identity Toolkit API.",
      suggestion: `Grant the service account the "Service Usage Consumer" role (roles/serviceusage.serviceUsageConsumer) in Google Cloud IAM: ${iamUrl}. After granting the role, wait a few minutes for permissions to propagate, then try again.`,
    };
  }

  // Check for common error message patterns
  if (errorMessage.includes("Missing") || errorMessage.includes("missing")) {
    return {
      error: "Missing Firebase Admin configuration",
      details: errorMessage,
      suggestion:
        "Check that FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are all set in .env.local",
    };
  }

  if (errorMessage.includes("private key") || errorMessage.includes("credential")) {
    return {
      error: "Firebase Admin credential error",
      details: errorMessage,
      suggestion:
        "Verify FIREBASE_ADMIN_PRIVATE_KEY format in .env.local. It should include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- markers.",
    };
  }

  // Generic error
  return {
    error: "Failed to create session",
    details: errorMessage,
    suggestion:
      process.env.NODE_ENV === "development"
        ? "Check the server console for detailed error logs. Visit /api/auth/debug for configuration diagnostics."
        : "Please try again. If the problem persists, contact support.",
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate project IDs match
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    if (clientProjectId && adminProjectId && clientProjectId !== adminProjectId) {
      return NextResponse.json(
        {
          error: "Firebase project mismatch",
          details:
            "Client and Admin SDK must use the same Firebase project.",
          suggestion:
            "Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_ADMIN_PROJECT_ID match in .env.local",
        },
        { status: 500 }
      );
    }

    // Validate Admin SDK initialization early
    let adminApp;
    try {
      adminApp = getAdminApp();
    } catch (initError) {
      console.error("[session] Firebase Admin SDK initialization failed:", initError);
      const errorInfo = getFirebaseErrorMessage(initError);
      return NextResponse.json(
        {
          error: errorInfo.error,
          details: errorInfo.details,
          suggestion: errorInfo.suggestion,
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const idToken = body?.idToken?.toString();
    if (!idToken) {
      return NextResponse.json(
        { error: "Missing idToken", details: "No ID token provided in request." },
        { status: 400 }
      );
    }

    // Basic token format validation (JWT has 3 parts separated by dots)
    const tokenParts = idToken.split(".");
    if (tokenParts.length !== 3) {
      return NextResponse.json(
        {
          error: "Invalid token format",
          details: "The ID token format is invalid.",
          suggestion: "Please try signing in again.",
        },
        { status: 400 }
      );
    }

    // Create session cookie
    const auth = getAuth(adminApp);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    const res = NextResponse.json({ status: "success" });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[session] Failed to create session:", e);
    const errorInfo = getFirebaseErrorMessage(e);
    return NextResponse.json(
      {
        error: errorInfo.error,
        details: errorInfo.details,
        suggestion: errorInfo.suggestion,
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ status: "success" });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/"
  });
  return res;
}
