import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME, PUBLIC_URL } from "@/lib/r2";

export async function POST(request) {
  try {
    // Get filename from the request
    const { filename } = await request.json();

    // Generate a unique filename to prevent collisions
    const uniqueFilename = `video-${Date.now()}-${filename}`;

    // Create a command that says "I want to upload a file"
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: "video/webm",
    });

    // Generate a temporary URL that allows uploading
    // This URL expires in 1 hour (3600 seconds)
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    // The final public URL where the video will be accessible
    const publicUrl = `${PUBLIC_URL}/${uniqueFilename}`;

    // Send both URLs back to the client
    return NextResponse.json({
      uploadUrl, // Use this to upload
      publicUrl, // Use this to access the file after upload
      filename: uniqueFilename,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
