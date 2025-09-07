import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';
import { drawPose, calculatePostureScore } from '../utils/posture';
import ScoreDisplay from './ui/ScoreDisplay';
import { Video, VideoOff, Zap, ShieldCheck } from 'lucide-react';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

const PostureCorrector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState<posenet.PoseNet | null>(null);
  const [score, setScore] = useState(100);
  const [statusText, setStatusText] = useState('Loading AI Model...');
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    tf.ready().then(() => {
      posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
        multiplier: 0.75
      }).then(net => {
        setModel(net);
        setIsLoading(false);
        setStatusText('Ready to start camera');
      }).catch(error => {
        console.error("Failed to load PoseNet model:", error);
        setStatusText('Error: Could not load AI model.');
        setIsLoading(false);
      });
    });
  }, []);

  const detectPose = useCallback(async (net: posenet.PoseNet) => {
    if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
      const video = videoRef.current;
      const pose = await net.estimateSinglePose(video, {
        flipHorizontal: false
      });

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-VIDEO_WIDTH, 0);
        ctx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        
        if (pose) {
          drawPose(pose, ctx);
          const newScore = calculatePostureScore(pose);
          setScore(prevScore => Math.round(prevScore * 0.8 + newScore * 0.2)); // Smooth the score
        }
        
        ctx.restore();
      }
    }
    if (isCameraOn) {
      animationFrameId.current = requestAnimationFrame(() => detectPose(net));
    }
  }, [isCameraOn]);

  useEffect(() => {
    if (isCameraOn && model) {
      animationFrameId.current = requestAnimationFrame(() => detectPose(model));
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraOn, model, detectPose]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
      setStatusText('Camera off. Start to begin analysis.');
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      }
    } else {
      if (!model) {
        setStatusText("AI Model is not ready. Please refresh.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraOn(true);
            setStatusText('Live analysis running...');
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatusText('Camera permission denied or error.');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      <div className="lg:col-span-2 bg-slate-800/50 rounded-xl shadow-lg p-4 sm:p-6 border border-slate-700 backdrop-blur-sm">
        <div className="relative aspect-w-4 aspect-h-3">
          <canvas ref={canvasRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} className="rounded-lg w-full h-full object-cover" />
          <video ref={videoRef} style={{ display: 'none' }} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} playsInline />
          {!isCameraOn && (
            <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center rounded-lg">
              <VideoOff className="w-16 h-16 text-slate-500 mb-4" />
              <p className="text-slate-400">Camera is off</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
          <button
            onClick={toggleCamera}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isCameraOn ? <VideoOff size={20} /> : <Video size={20} />}
            {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </button>
          <p className="mt-4 sm:mt-0 text-sm text-slate-400">{statusText}</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 border border-slate-700 backdrop-blur-sm text-center">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Live Posture Score</h2>
          <ScoreDisplay score={score} />
          <p className="text-sm text-slate-400 mt-4">
            {score > 90 ? "Excellent! Keep it up." : score > 70 ? "Good, but a little adjustment could help." : "Try to sit up straighter."}
          </p>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 border border-slate-700 backdrop-blur-sm">
           <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2"><Zap className="text-amber-400" />Coming Soon</h2>
           <ul className="space-y-3 text-slate-400 text-sm list-disc list-inside">
            <li>Custom posture alerts</li>
            <li>Progress tracking charts</li>
            <li>Gamification and streaks</li>
          </ul>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl shadow-lg p-6 border border-slate-700 backdrop-blur-sm">
           <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2"><ShieldCheck className="text-green-400" />Privacy First</h2>
           <p className="text-sm text-slate-400">All AI processing happens on your device. Your camera feed never leaves your computer.</p>
        </div>
      </div>
    </div>
  );
};

export default PostureCorrector;
