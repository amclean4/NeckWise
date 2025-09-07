import { Pose, Keypoint } from '@tensorflow-models/posenet';

const MIN_CONFIDENCE = 0.5;

// Helper to get a keypoint by name if it meets the confidence threshold
const getKeypoint = (pose: Pose, part: string): Keypoint | undefined => {
  return pose.keypoints.find(kp => kp.part === part && kp.score > MIN_CONFIDENCE);
};

// --- DRAWING LOGIC ---
function drawPoint(ctx: CanvasRenderingContext2D, y: number, x: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawPose(pose: Pose, ctx: CanvasRenderingContext2D) {
  // Draw all keypoints that meet the confidence score
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > MIN_CONFIDENCE) {
      const { y, x } = keypoint.position;
      drawPoint(ctx, y, x, 5, '#FFD700'); // Gold color for points
    }
  });

  const leftShoulder = getKeypoint(pose, 'leftShoulder');
  const rightShoulder = getKeypoint(pose, 'rightShoulder');
  const nose = getKeypoint(pose, 'nose');

  // Draw the shoulder line
  if (leftShoulder && rightShoulder) {
    ctx.beginPath();
    ctx.moveTo(leftShoulder.position.x, leftShoulder.position.y);
    ctx.lineTo(rightShoulder.position.x, rightShoulder.position.y);
    ctx.strokeStyle = '#14B8A6'; // Teal
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  // Draw a vertical alignment line from nose to shoulder midpoint
  if (nose && leftShoulder && rightShoulder) {
    const shoulderMidpointX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
    const shoulderMidpointY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
    ctx.beginPath();
    ctx.moveTo(nose.position.x, nose.position.y);
    ctx.lineTo(shoulderMidpointX, shoulderMidpointY);
    ctx.strokeStyle = '#EC4899'; // Pink
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// --- SCORING LOGIC ---
export function calculatePostureScore(pose: Pose): number {
  const leftShoulder = getKeypoint(pose, 'leftShoulder');
  const rightShoulder = getKeypoint(pose, 'rightShoulder');
  const leftEye = getKeypoint(pose, 'leftEye');
  const rightEye = getKeypoint(pose, 'rightEye');
  const nose = getKeypoint(pose, 'nose');

  if (!leftShoulder || !rightShoulder || !leftEye || !rightEye || !nose) {
    return 0; // Not enough points detected to calculate a reliable score
  }

  let score = 100;

  // 1. Shoulder Levelness (up to 50 points)
  const shoulderYDiff = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
  const shoulderXDiff = Math.abs(leftShoulder.position.x - rightShoulder.position.x);
  const shoulderTiltRatio = shoulderYDiff / shoulderXDiff;
  const shoulderPenalty = Math.min(shoulderTiltRatio * 500, 50);
  score -= shoulderPenalty;

  // 2. Head Tilt (up to 30 points)
  const eyeYDiff = Math.abs(leftEye.position.y - rightEye.position.y);
  const eyeXDiff = Math.abs(leftEye.position.x - rightEye.position.x);
  const eyeTiltRatio = eyeYDiff / eyeXDiff;
  const headTiltPenalty = Math.min(eyeTiltRatio * 300, 30);
  score -= headTiltPenalty;

  // 3. Head Centering over Shoulders (up to 20 points)
  const shoulderMidpointX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
  const headOffset = Math.abs(nose.position.x - shoulderMidpointX);
  const headOffsetRatio = headOffset / shoulderXDiff;
  const headOffsetPenalty = Math.min(headOffsetRatio * 200, 20);
  score -= headOffsetPenalty;

  return Math.max(0, Math.round(score));
}
