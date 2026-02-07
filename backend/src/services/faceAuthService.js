import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';
import { env } from '../config/env.js';

const client = new RekognitionClient({ region: env.awsRegion });

export async function verifyFace({ sourceImageBytes, targetImageBytes, threshold = 90 }) {
  const command = new CompareFacesCommand({
    SimilarityThreshold: threshold,
    SourceImage: { Bytes: sourceImageBytes },
    TargetImage: { Bytes: targetImageBytes }
  });

  const response = await client.send(command);
  const bestMatch = response.FaceMatches?.[0];

  return {
    matched: Boolean(bestMatch),
    similarity: bestMatch?.Similarity || 0
  };
}
